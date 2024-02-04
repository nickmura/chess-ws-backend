import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChessService } from './chess.service';
import { Move } from 'chess.js';
import { Cache } from '@nestjs/cache-manager';

@WebSocketGateway({ transports: ['websocket'] })
export class ChessGateway {
  constructor(
    private chessService: ChessService,
    private cacheManager: Cache,
  ) {}

  @WebSocketServer()
  server: Server;

  // rooms = new Map();
  // unfilledRooms: Array<string> = [];

  async handleConnection() {
    console.log('New connection');

    // console.log(await this.cacheManager.store.keys());

    // console.log(this.rooms, this.unfilledRooms);
  }

  @SubscribeMessage('create:chess-room')
  async createChessRoom(
    @MessageBody() data: { userId: string; stake: number },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.chessService.createChessRoom(data);

    await client.join(result.roomId);

    return client.emit('created:chess-room', {
      message: `Successfully created chessroom with ${result.stake} wager!`,
      data: result,
    });
  }

  @SubscribeMessage('join:chess')
  async handleJoinChess(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.chessService.joinAnyRoom(data);

    await client.join(result.roomId);

    // console.log(result, 'result');

    return client.emit('joined:chess', {
      message: `You joined the chess room ${result.roomId}`,
      data: result,
    });
  }

  @SubscribeMessage('join:chess:room')
  async handleRoomIdJoin(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.chessService.joinRoomById(data);

    // console.log({ result });

    if (result) {
      // console.log(result);
      await client.join(result.roomId);

      // console.log(data.userId + ' has rooms ' + client.rooms.values());

      return client.emit('joined:chess', {
        message: `You joined the chess room ${data.roomId}`,
        data: result,
      });
    }
  }

  @SubscribeMessage('update:chess')
  async handleUpdateChess(
    @MessageBody()
    data: {
      roomId: string;
      userId: string;
      move: Move;
      // chessState: any;
    },
    // @ConnectedSocket() client: Socket,
  ) {
    const result = await this.chessService.movePiece(data);
    // console.log(result, 'res');
    // console.log(client.rooms, data, 'update:chess');
    // this.rooms.get(data.roomId).chessState = data.chessState;

    // console.log(client.)

    if (!result) return;

    // console.log(client.)

    // return client.in(result.roomId).emit('update:chess', result);
    return this.server.in(result.roomId).emit('update:chess', result);
    // return client.broadcast('update:chess', result);
    // return client.emit('update:chess', result);
  }

  @SubscribeMessage('chess:lobby')
  async handleGetChessLobby() {
    const lobbies = await this.chessService.getLobby();

    return this.server.emit('chess:lobby', {
      message: 'Successfully retrived lobbies',
      data: lobbies,
    });
  }

  async handleDisconnect() {
    // console.log('disconnecting', data);
  }

  // @SubscribeMessage('chess:lobby')
  // async handleChessLobby() {
  //   return this.server.emit('chess:lobby', this.chessService.getChessLobby());
  // }
}
