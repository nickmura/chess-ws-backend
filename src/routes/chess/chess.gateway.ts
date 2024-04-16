import {
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

  async handleConnection() {
    console.log('New connection');
  }

  async handleDisconnect() {
    // console.log('disconnecting', data);
  }

  async afterInit(data: Server) {
    this.server = data;
  }

  @SubscribeMessage('create:chess-room')
  async createChessRoom(
    client: Socket,
    data: { userId: string; stake: number; roomId: string },
  ) {
    const result = await this.chessService.createChessRoom(data);

    await client.join(result.roomId);

    return client.emit('created:chess-room', {
      message: `Successfully created chessroom with ${result.stake} wager!`,
      data: result,
    });
  }

  // @SubscribeMessage('join:chess')
  // async handleJoinChess(client: Socket, data: { userId: string }) {
  //   const result = await this.chessService.joinAnyRoom(data);

  //   await client.join(result.roomId);

  //   // console.log(result, 'result');

  //   return client.emit('joined:chess', {
  //     message: `You joined the chess room ${result.roomId}`,
  //     data: result,
  //   });
  // }

  @SubscribeMessage('join:chess:room')
  async handleRoomIdJoin(
    client: Socket,
    data: { roomId: string; userId: string; txId?: string },
  ) {
    const result = await this.chessService.joinRoomById(data);

    // console.log({ result });

    if (result) {
      // console.log(result, 'result');
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
    _,
    data: {
      roomId: string;
      userId: string;
      move: Move;
      // chessState: any;
    },
    // client: Socket,
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

  @SubscribeMessage('end:chess')
  async handleLeaveChess(_, data: { roomId: string; userId: string }) {
    if (!data?.roomId || !data.userId) return;
    const result = await this.chessService.endChessRoom(data);

    if (!result) return;

    return this.server
      .in(data.roomId)
      .emit('end:chess', { message: 'This room has ended', data: result });
  }

  @SubscribeMessage('chess:lobby')
  async handleGetChessLobby() {
    const lobbies = await this.chessService.getLobby();

    // console.log(lobbies, this.server, 'here');

    return this.server.emit('chess:lobby', {
      message: 'Successfully retrived lobbies',
      data: lobbies,
    });
  }

  @SubscribeMessage('chess:collect-win')
  async handleCollectWin(
    _,
    data: {
      userId: string;
      txId: string;
      roomId: string;
    },
  ) {
    const result = await this.chessService.collectWin(data);

    if (!result) return;

    return this.server.in(data.roomId).emit('chess:collected-win', {
      message: `[Match Win] Player ${data.userId} has successfully collected their win.`,
    });
  }

  @SubscribeMessage('chess:collect-draw')
  async handleCollectDraw(
    _,
    data: {
      userId: string;
      txId: string;
      roomId: string;
    },
  ) {
    const result = await this.chessService.collectDraw(data);

    if (!result) return;

    return this.server.in(data.roomId).emit('chess:collected-draw', {
      message: `[Match Draw] Player ${data.userId} has successfully collected their stake.`,
    });
  }

  @SubscribeMessage('chess:avert')
  async handleAvert(_, data: { userId: string; txId: string; roomId: string }) {
    const result = await this.chessService.avertGame(data);

    console.log(result, 'result');

    if (!result) return;

    // console.log(client.rooms, data, 'client');

    return this.server.in(data.roomId).emit('chess:averted', {
      message: `[Match Averted] You (${data.userId}) averted the game and has successfully collected your stake.`,
    });
  }
}
