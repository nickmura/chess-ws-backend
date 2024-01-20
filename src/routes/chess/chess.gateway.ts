import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';

/**
 *
 */

@WebSocketGateway({ transports: ['websocket'] })
export class ChessGateway {
  rooms = new Map();
  unfilledRooms: Array<string> = [];

  handleConnection() {
    console.log('New connection');

    console.log(this.rooms, this.unfilledRooms);
  }

  @SubscribeMessage('join:chess')
  async handleJoinChess(
    @MessageBody() data: { userId: string | number },
    @ConnectedSocket() client: Socket,
  ) {
    // console.log(data, 'client', client.id);

    const unfilledRoom = this.unfilledRooms.shift();

    if (unfilledRoom) {
      await client.join(unfilledRoom);
      this.rooms.set(unfilledRoom, {
        ...this.rooms.get(unfilledRoom),
        player2: data.userId,
      });

      return client.emit('joined:chess', {
        message: `You joined the chess room ${unfilledRoom}`,
        data: { roomId: unfilledRoom, ...this.rooms.get(unfilledRoom) },
      });
    } else {
      const roomId = randomUUID();
      this.rooms.set(roomId, { player1: data.userId });
      this.unfilledRooms.push(roomId);
      await client.join(roomId);

      return client.emit('joined:chess', {
        message: `You joined the chess room ${roomId}`,
        data: { roomId, ...this.rooms.get(roomId) },
      });
    }
  }

  @SubscribeMessage('join:chess:room')
  async handleRoomIdJoin(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomDetails = this.rooms.get(data.roomId);

    // console.log(this.rooms, roomDetails, new Date());

    if (
      roomDetails &&
      (roomDetails?.player1 === data.userId ||
        roomDetails?.player2 === data.userId)
    ) {
      await client.join(data.roomId);
      return client.emit('joined:chess', {
        message: `You joined the chess room ${data.roomId}`,
        data: {
          roomId: data.roomId,
          ...this.rooms.get(data.roomId),
        },
      });
    }

    // return client.emit('update:chess', data);
  }

  @SubscribeMessage('update:chess')
  handleUpdateChess(
    @MessageBody()
    data: {
      roomId: string;
      player: string;
      move: Record<string, string>;
      chessState: any;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // console.log(data, 'Data');
    // console.log(client.rooms, data, 'update:chess');
    this.rooms.get(data.roomId).chessState = data.chessState;

    return client.in([data.roomId]).emit('update:chess', data.move);
  }
}
