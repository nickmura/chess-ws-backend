import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { Chess, DEFAULT_POSITION, Move } from 'chess.js';
import { IChessRoom } from './chess.types';
import { InjectRepository } from '@nestjs/typeorm';
import { ChessGame } from 'src/entities/chessGame.entity';
import { Repository } from 'typeorm';
import { CHESS_EVENT_URL, CHESS_TRANSACTION_BY_ID_URL } from 'src/constants';

@Injectable()
export class ChessService {
  constructor(
    private cacheManager: Cache,
    @InjectRepository(ChessGame)
    private chessGameRepository: Repository<ChessGame>,
  ) {}

  async createChessRoom(data: {
    userId: string;
    stake: number;
    roomId: string;
  }) {
    // const roomId = nanoid(8);

    const room: IChessRoom = {
      fen: DEFAULT_POSITION,
      onlineCount: 1,
      player1: {
        isConnected: true,
        side: 'w',
        userId: data.userId,
      },
      player2: {
        isConnected: false,
        side: 'b',
        userId: null,
      },
      stake: data.stake,
      turn: 'w',
      roomId: data.roomId,
      txns: [],
    };

    const unfilledRooms =
      (await this.cacheManager.get<Array<string>>('chess:unfilled-rooms')) ||
      [];

    let counter = 0;
    // this variable determines whether chess game shall be created or not
    let shouldCreateChessGame = true;

    if (Number(room.stake) !== 0) {
      // set it to false, so that we can only create the chess game if we find the index for this roomId
      // i.e transaction has happened on chain
      shouldCreateChessGame = false;
      while (!room?.index && counter < 5000) {
        counter++;
        try {
          const res = await (await fetch(CHESS_EVENT_URL))?.json();

          // find the index number of block associated with this game room
          // and save it
          room.index = res?.data?.find(
            (event: { result: { index?: string; _gameId: string } }) =>
              String(event?.result._gameId) === String(data.roomId),
          )?.result?.index;

          if (room.index) {
            shouldCreateChessGame = true;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (!shouldCreateChessGame) return null;

    await Promise.all([
      this.cacheManager.set(`chess:rooms:${data.roomId}`, room, 0),
      this.cacheManager.set('chess:unfilled-rooms', [
        ...unfilledRooms,
        data.roomId,
      ]),
    ]);

    return room;
  }

  // async joinAnyRoom(data: { userId: string }) {
  //   const cachedUnfilledRooms = await this.cacheManager.get<Array<string>>(
  //     'chess:unfilled-rooms',
  //   );

  //   // console.log('joinAnyRoom', { cachedUnfilledRooms });
  //   const unfilledRooms = cachedUnfilledRooms || [];
  //   // ? JSON.parse(String(cachedUnfilledRooms))
  //   // : [];

  //   const unfilledRoom = unfilledRooms.shift();
  //   // console.log('joinAnyRoom', { unfilledRoom });

  //   const cachedRoom = await this.cacheManager.get<IChessRoom>(
  //     `chess:rooms:${unfilledRoom}`,
  //   );

  //   // console.log('joinAnyRoom', { unfilledRoom });
  //   const room: IChessRoom = cachedRoom || ({} as IChessRoom); // ? JSON.parse(String(cachedRoom)) : {};

  //   if (unfilledRoom) {
  //     room.player2 = {
  //       userId: data.userId,
  //       isConnected: true,
  //       side: 'b',
  //     };

  //     await Promise.all([
  //       this.cacheManager.set(
  //         `chess:rooms:${unfilledRoom}`,
  //         // JSON.stringify(room),
  //         room,
  //         0,
  //       ),
  //       this.cacheManager.set(
  //         'chess:unfilled-rooms',
  //         // JSON.stringify(unfilledRooms),
  //         unfilledRooms,
  //         0, // dont expire this cache
  //       ),
  //     ]);

  //     return { roomId: unfilledRoom, ...room };
  //   }

  //   const roomId = nanoid(8);
  //   room.player1 = { userId: data.userId, side: 'w', isConnected: true };
  //   room.player2 = { userId: null, side: 'b', isConnected: false };
  //   room.fen = DEFAULT_POSITION;
  //   room.turn = 'w';

  //   await this.cacheManager.set(
  //     `chess:rooms:${roomId}`,
  //     // JSON.stringify(room),
  //     room,
  //     0,
  //   );

  //   unfilledRooms.push(roomId);

  //   await this.cacheManager.set(
  //     'chess:unfilled-rooms',
  //     // JSON.stringify(unfilledRooms),
  //     unfilledRooms,
  //     0, // dont expire this cache
  //   );

  //   return { roomId, ...room };
  // }

  async joinRoomById(data: { roomId: string; userId: string; txId?: string }) {
    const room = await this.cacheManager.get<IChessRoom>(
      `chess:rooms:${data.roomId}`,
    );

    // if no room with given id exists
    if (!room) {
      const endedGame = await this.chessGameRepository.findOneBy({
        id: data.roomId,
      });

      if (endedGame) {
        // return ended game so that we can show it was ended when someone visits the chess url
        return {
          fen: endedGame.fen,
          onlineCount: 0,
          player1: {
            isConnected: false,
            side: endedGame.player1.side,
            userId: endedGame.player1.id,
          },
          player2: {
            isConnected: false,
            side: endedGame.player2.side,
            userId: endedGame.player2.id,
          },
          roomId: endedGame.id,
          stake: endedGame.wager,
          turn: 'w',
          // endedAt is set to endedGame's createdAt because
          // chess room is first stored in redis only
          // then after the game ends it is moved to database
          endedAt: new Date(endedGame.createdAt),
          winner: endedGame.winner,
        } as unknown as IChessRoom;
      } else {
        return null;
      }
    }

    // if the chess room has one person seat available
    // and current requesting user to connect isnt player 1
    if (room.player2.userId === null && room.player1.userId !== data.userId) {
      if (Number(room.stake) > 0) {
        // if room has stake and no txId is supplied during join by ID
        if (!data.txId) return null;

        const res = await fetch(CHESS_TRANSACTION_BY_ID_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: data.txId,
          }),
        });

        const json = await res.json();

        // console.log(room, 'room');

        // console.log(json, 'json');

        const stakeTrx =
          Number(json?.raw_data?.contract?.[0]?.parameter?.value?.call_value) /
          1_000_000;

        // console.log(
        //   'call_Value',
        //   json?.raw_data?.contract?.[0]?.parameter?.value?.call_value,
        //   'stakeTrx',
        //   stakeTrx,
        // );

        // we have the stakedTrx amount for the provided tx id on chain and the stake value matches
        if (stakeTrx && stakeTrx === Number(room.stake)) {
          // console.log('valid');
          room.txns.push({
            player: data.userId,
            action: 'join-game',
            txnId: data.txId,
          });
        } else {
          // console.log('invalid returning');
          return null;
        }
      }

      room.player2 = {
        userId: data.userId,
        isConnected: true,
        side: 'b',
      };

      let unfilledRooms =
        (await this.cacheManager.get<Array<string>>('chess:unfilled-rooms')) ||
        [];

      unfilledRooms = unfilledRooms.filter((id) => id !== data.roomId);

      await Promise.all([
        this.cacheManager.set('chess:unfilled-rooms', unfilledRooms),
        this.cacheManager.set(`chess:rooms:${data.roomId}`, room),
      ]);

      return {
        roomId: data.roomId,
        ...room,
      };
    }

    // if the requesting player was already in room
    if (
      room.player1.userId === data.userId ||
      room.player2.userId === data.userId
    ) {
      return {
        roomId: data.roomId,
        ...room,
      };
    }

    return null;
  }

  async movePiece(data: { roomId: string; userId: string; move: Move }) {
    const cachedRoom = await this.cacheManager.get<IChessRoom>(
      `chess:rooms:${data.roomId}`,
    );

    // console.log('movePiece', { cachedRoom });

    if (!cachedRoom) return null;

    const room: IChessRoom = cachedRoom; // JSON.parse(String(cachedRoom));

    // console.log('movePiece', { room })
    if (
      room.player1.userId !== data.userId &&
      room.player2.userId !== data.userId
    )
      return null;

    const playerSide =
      data.userId === room.player1.userId
        ? room.player1.side
        : room.player2.side;

    if (playerSide !== room.turn) return null;

    const chess = new Chess(room.fen);

    try {
      chess.move(data.move);
      room.fen = chess.fen();
      room.turn = playerSide === 'w' ? 'b' : 'w';

      await this.cacheManager.set(
        `chess:rooms:${data.roomId}`,
        // JSON.stringify(room),
        room,
        0,
      );
      return {
        roomId: data.roomId,
        move: data.move,
        ...room,
      };
    } catch (error) {
      // invalid move
      return {
        roomId: data.roomId,
        move: {},
        ...room,
      };
    }
  }

  async getLobby() {
    const unfilledRooms =
      (await this.cacheManager.get<Array<string>>('chess:unfilled-rooms')) ||
      [];

    // console.log(unfilledRooms, 'unfrim');

    const lobbies = [];

    await Promise.all(
      unfilledRooms.map(async (roomId) => {
        const room = await this.cacheManager.get<IChessRoom>(
          `chess:rooms:${roomId}`,
        );

        // console.log(room, 'room');

        if (room) {
          lobbies.push(room);
        }

        // return;
      }),
    );

    // console.log(lobbies, 'lobbies');

    return lobbies;
  }

  async endChessRoom(data: { roomId: string; userId: string }) {
    const cacheKey = `chess:rooms:${data.roomId}`;
    const cachedRoom = await this.cacheManager.get<IChessRoom>(cacheKey);

    if (!cachedRoom) return null;

    // requesting userId is the one who wants to leave the game so the other remaining player is the winner
    const winner =
      // if player 1 is requesting to end the game
      cachedRoom.player1.userId === data.userId
        ? // player 2 is winner
          cachedRoom.player2.userId
        : // if player 2 is requesting to end the game
          cachedRoom.player2.userId === data.userId
          ? // player 1 is winner
            cachedRoom.player1.userId
          : null;

    // room has player two but winner is null means, requesting userId isnt neither player1 nor player2
    if (!winner && cachedRoom.player2.userId) return null;

    // room only has one player, so delete from cache without saving in database
    if (!cachedRoom.player2.userId) {
      await this.cacheManager.del(cacheKey);
      await this.cacheManager.del(`chat-room:${data.roomId}`);

      let unfilledRooms =
        (await this.cacheManager.get<Array<string>>('chess:unfilled-rooms')) ||
        [];

      unfilledRooms = unfilledRooms.filter((roomId) => roomId !== data.roomId);

      await this.cacheManager.set('chess:unfilled-rooms', unfilledRooms);

      return true;
    }

    const chessGame = await this.persistChessGame(cachedRoom, winner);

    await this.cacheManager.del(cacheKey);
    await this.cacheManager.del(`chat-room:${data.roomId}`);

    return await this.chessGameRepository.save(chessGame);
  }

  async collectWin(data: { roomId: string; txId: string; userId: string }) {
    const cacheKey = `chess:rooms:${data.roomId}`;
    const room = await this.cacheManager.get<IChessRoom>(cacheKey);

    // console.log(room, 'room');
    if (!room) return null;

    // requesting userId isnt in the room
    if (
      data.userId !== room.player1.userId &&
      data.userId !== room.player2.userId
    )
      return null;

    const chess = new Chess(room.fen);
    const turn = chess.turn();

    const isGameOver =
      (chess.isCheckmate() || chess.isStalemate()) && !chess.isDraw();

    if (!isGameOver) return null;

    const requestingUserSide =
      room.player1.userId === data.userId
        ? room.player1.side
        : room.player2.side;

    // if it is checkmate/stalemate and it's white's turn then it means black has won
    // so if requesting user's side is equal to whose turn is in chess
    // then it means the requesting user is actually the loser and not the winner
    if (turn === requestingUserSide) return null;

    let counter = 0;

    let doesWinEventExists = false;

    if (Number(room.stake) !== 0) {
      while (!doesWinEventExists && counter < 5000) {
        counter++;
        try {
          const res = await (await fetch(CHESS_EVENT_URL))?.json();

          doesWinEventExists = !!res?.data?.find(
            (event: {
              result: { draw?: string; gameId: string };
              transaction_id: string;
            }) =>
              event.transaction_id === data.txId &&
              String(event.result.gameId) === String(room.roomId) &&
              event.result.draw === 'false',
          );
        } catch (e) {
          console.error(e);
        }
      }
    }

    // console.log(doesWinEventExists, 'doesWinEventExists');

    // Win event doesnt exist on chain so return without persisting current game
    if (!doesWinEventExists) return null;

    const chessGame = await this.persistChessGame(room, data.userId);

    chessGame.txns.push({
      action: 'collect-win',
      player: data.userId,
      txnId: data.txId,
    });

    await Promise.all([
      this.chessGameRepository.save(chessGame),
      this.cacheManager.del(cacheKey),
      this.cacheManager.del(`chat-room:${data.roomId}`),
    ]);

    return true;
  }

  async collectDraw(data: { roomId: string; txId: string; userId: string }) {
    const cacheKey = `chess:rooms:${data.roomId}`;
    const room = await this.cacheManager.get<IChessRoom>(cacheKey);

    // console.log(room, 'room');
    if (!room) return null;

    // requesting userId isnt in the room
    if (
      data.userId !== room.player1.userId &&
      data.userId !== room.player2.userId
    )
      return null;

    const chess = new Chess(room.fen);

    const isDraw = chess.isDraw();

    if (!isDraw) return null;

    let counter = 0;

    let doesDrawEventExists = false;

    if (Number(room.stake) !== 0) {
      while (!doesDrawEventExists && counter < 5000) {
        // console.log(counter);
        counter++;
        try {
          const res = await (await fetch(CHESS_EVENT_URL))?.json();

          // console.log(res, 'res');

          doesDrawEventExists = !!res?.data?.find(
            (event: {
              result: { draw?: string; gameId: string };
              transaction_id: string;
            }) =>
              event.transaction_id === data.txId &&
              String(event.result.gameId) === String(room.roomId) &&
              event.result.draw === 'true',
          );

          // console.log('ended now repeating the loop');
        } catch (e) {
          console.error(e);
        }
      }
    }

    // console.log(doesDrawEventExists, 'doesDrawEventExists');
    // Draw event doesnt exist on chain so return without persisting current game
    if (!doesDrawEventExists) return null;

    // check if current requesting user has already collected draw
    const alreadyCollectedDraw = room.txns.find(
      (txn) => txn.player === data.userId && txn.action === 'collect-draw',
    );

    // console.log({ alreadyCollectedDraw });

    if (!alreadyCollectedDraw) {
      room.txns.push({
        action: 'collect-draw',
        player: data.userId,
        txnId: data.txId,
      });

      const bothPlayersCollectedDraw =
        room.txns.find(
          (txn) =>
            txn.player === room.player1.userId && txn.action === 'collect-draw',
        ) &&
        room.txns.find(
          (txn) =>
            txn.player === room.player2.userId && txn.action === 'collect-draw',
        );

      if (bothPlayersCollectedDraw) {
        // delete cached data so the game is ended game and only accessible in db
        await Promise.all([
          this.persistChessGame(room, null),
          this.cacheManager.del(cacheKey),
          this.cacheManager.del(`chat-room:${data.roomId}`),
        ]);
      } else {
        await this.cacheManager.set(cacheKey, room);
      }

      return true;
    }
    return null;
  }

  async avertGame(data: { roomId: string; txId: string; userId: string }) {
    const cacheKey = `chess:rooms:${data.roomId}`;
    const room = await this.cacheManager.get<IChessRoom>(cacheKey);

    // console.log(cacheKey, room);

    if (!room) return null;

    // room already has another plyaer
    // cannot be averted
    if (room.player2.userId) {
      return null;
    }

    // requesting userId isnt in the room
    if (data.userId !== room.player1.userId) return null;

    let counter = 0;
    // let shouldAvertChessGame = true;
    let doesAvertEventExists = false;

    if (Number(room.stake) !== 0) {
      while (!doesAvertEventExists && counter < 5000) {
        counter++;
        try {
          const res = await (await fetch(CHESS_EVENT_URL))?.json();

          doesAvertEventExists = !!res?.data?.find(
            (event: {
              result: { draw?: string; gameId: string };
              transaction_id: string;
            }) =>
              event.transaction_id === data.txId &&
              String(event.result.gameId) === String(room.roomId) &&
              event.result.draw === 'true',
          );
        } catch (e) {
          console.error(e);
        }
      }
    }

    // avert event doesnt exist on chain so return without persisting current game
    if (!doesAvertEventExists) return null;

    const chessGame = await this.persistChessGame(room, null, false);

    chessGame.txns.push({
      action: 'avert-game',
      player: data.userId,
      txnId: data.txId,
    });

    // console.log(chessGame, 'chessGame');
    await chessGame.save();

    await Promise.all([
      this.cacheManager.del(cacheKey),
      this.cacheManager.del(`chat-room:${data.roomId}`),
    ]);

    // console.log('after promise all');

    return true;
  }

  async persistChessGame(
    room: IChessRoom,
    winner: string | null,
    persist?: boolean,
  ) {
    const chessGame = new ChessGame();

    chessGame.fen = room.fen;
    chessGame.id = room.roomId;
    chessGame.player1 = {
      id: room.player1.userId,
      side: room.player1.side,
    };
    chessGame.player2 = {
      id: room.player2.userId,
      side: room.player2.side,
    };
    chessGame.wager = room.stake;
    chessGame.winner = winner;
    chessGame.index = room.index;
    chessGame.txns = [];

    if (!persist) {
      return chessGame;
    }

    return await this.chessGameRepository.save(chessGame);
  }
}
