import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { Chess, DEFAULT_POSITION, Move } from 'chess.js';
import { IChessRoom } from './chess.types';
import { nanoid } from 'nanoid';

@Injectable()
export class ChessService {
  constructor(private cacheManager: Cache) {}

  async createChessRoom(data: { userId: string; stake: number }) {
    const roomId = nanoid(8);
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
      roomId,
    };

    const unfilledRooms =
      (await this.cacheManager.get<Array<string>>('chess:unfilled-rooms')) ||
      [];

    await Promise.all([
      this.cacheManager.set(`chess:rooms:${roomId}`, room, 0),
      this.cacheManager.set('chess:unfilled-rooms', [...unfilledRooms, roomId]),
    ]);

    return room;
  }

  async joinAnyRoom(data: { userId: string }) {
    const cachedUnfilledRooms = await this.cacheManager.get<Array<string>>(
      'chess:unfilled-rooms',
    );

    // console.log('joinAnyRoom', { cachedUnfilledRooms });
    const unfilledRooms = cachedUnfilledRooms || [];
    // ? JSON.parse(String(cachedUnfilledRooms))
    // : [];

    const unfilledRoom = unfilledRooms.shift();
    // console.log('joinAnyRoom', { unfilledRoom });

    const cachedRoom = await this.cacheManager.get<IChessRoom>(
      `chess:rooms:${unfilledRoom}`,
    );

    // console.log('joinAnyRoom', { unfilledRoom });
    const room: IChessRoom = cachedRoom || ({} as IChessRoom); // ? JSON.parse(String(cachedRoom)) : {};

    if (unfilledRoom) {
      room.player2 = {
        userId: data.userId,
        isConnected: true,
        side: 'b',
      };

      await Promise.all([
        this.cacheManager.set(
          `chess:rooms:${unfilledRoom}`,
          // JSON.stringify(room),
          room,
          0,
        ),
        this.cacheManager.set(
          'chess:unfilled-rooms',
          // JSON.stringify(unfilledRooms),
          unfilledRooms,
          0, // dont expire this cache
        ),
      ]);

      return { roomId: unfilledRoom, ...room };
    }

    const roomId = nanoid(8);
    room.player1 = { userId: data.userId, side: 'w', isConnected: true };
    room.player2 = { userId: null, side: 'b', isConnected: false };
    room.fen = DEFAULT_POSITION;
    room.turn = 'w';

    await this.cacheManager.set(
      `chess:rooms:${roomId}`,
      // JSON.stringify(room),
      room,
      0,
    );

    unfilledRooms.push(roomId);

    await this.cacheManager.set(
      'chess:unfilled-rooms',
      // JSON.stringify(unfilledRooms),
      unfilledRooms,
      0, // dont expire this cache
    );

    return { roomId, ...room };
  }

  async joinRoomById(data: { roomId: string; userId: string }) {
    const cachedRoom = await this.cacheManager.get<IChessRoom>(
      `chess:rooms:${data.roomId}`,
    );

    // if no room with given id exists
    if (!cachedRoom) return null;

    const room: IChessRoom = cachedRoom;

    // if the chess room has one person seat available
    // and current requesting user to connect isnt player 1
    if (room.player2.userId === null && room.player1.userId !== data.userId) {
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
}
