import { Injectable } from '@nestjs/common';
import { Chess, DEFAULT_POSITION, Move } from 'chess.js';
import { randomUUID } from 'crypto';

@Injectable()
export class ChessService {
  private rooms = new Map<
    string,
    {
      player1: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
      player2: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
      fen: string;
      turn: 'b' | 'w';
    }
  >();
  /**
   * list of roomId which have seat for a player
   */
  private unfilledRooms: Array<string> = [];

  joinAnyRoom(data: { userId: string }) {
    const unfilledRoom = this.unfilledRooms.shift();

    if (unfilledRoom) {
      this.rooms.set(unfilledRoom, {
        ...this.rooms.get(unfilledRoom),
        player2: {
          userId: data.userId,
          isConnected: true,
          side: 'b',
        },
      });

      return { roomId: unfilledRoom, ...this.rooms.get(unfilledRoom) };
    }

    const roomId = randomUUID();
    this.rooms.set(roomId, {
      player1: { userId: data.userId, side: 'w', isConnected: true },
      player2: { userId: null, side: 'b', isConnected: false },
      fen: DEFAULT_POSITION,
      turn: 'w',
    });
    this.unfilledRooms.push(roomId);

    return { roomId, ...this.rooms.get(roomId) };
  }

  joinRoomById(data: { roomId: string; userId: string }) {
    const roomDetails = this.rooms.get(data.roomId);

    // if no room with given id exists
    if (!roomDetails) return null;

    // if request room wasnt joined by user earlier
    if (
      roomDetails.player1.userId !== data.userId &&
      roomDetails.player2.userId !== data.userId
    )
      return null;

    return {
      roomId: data.roomId,
      ...this.rooms.get(data.roomId),
    };
  }

  movePiece(data: { roomId: string; userId: string; move: Move }) {
    const roomDetails = this.rooms.get(data.roomId);

    if (!roomDetails) return null;

    if (
      roomDetails.player1.userId !== data.userId &&
      roomDetails.player2.userId !== data.userId
    )
      return null;

    const playerSide =
      data.userId === roomDetails.player1.userId
        ? roomDetails.player1.side
        : roomDetails.player2.side;

    if (playerSide !== roomDetails.turn) return null;

    const chess = new Chess(roomDetails.fen);

    try {
      chess.move(data.move);
      roomDetails.fen = chess.fen();
      roomDetails.turn = playerSide === 'w' ? 'b' : 'w';

      return {
        roomId: data.roomId,
        move: data.move,
        ...roomDetails,
      };
    } catch (error) {
      // invalid move
      return {
        roomId: data.roomId,
        move: {},
        ...roomDetails,
      };
    }
  }
}
