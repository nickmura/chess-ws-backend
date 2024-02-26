import { Cache } from '@nestjs/cache-manager';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { IChat } from './chess.types';
import { randomUUID } from 'crypto';

@WebSocketGateway({ transports: ['websocket'] })
export class ChatGateway {
  constructor(private cacheManager: Cache) {}

  @WebSocketServer()
  server: Server;

  async handleConnection() {
    // console.log('New connection');
  }

  async afterInit(data: Server) {
    this.server = data;
  }

  @SubscribeMessage('chat:messages')
  async getChatRoomMessages(_, data: { roomId: string }) {
    let chat = await this.cacheManager.get<Array<IChat>>(
      `chat-room:${data.roomId}`,
    );

    if (!chat) {
      await this.cacheManager.set(`chat-room:${data.roomId}`, []);
      chat = [];
    }

    return this.server.to(data.roomId).emit('chat:messages', {
      message: 'Successfully retrieved all chat!',
      data: chat,
    });
  }

  @SubscribeMessage('chat:send-message')
  async createChatMessage(
    _,
    data: { roomId: string; userId: string; message: string },
  ) {
    let chat = await this.cacheManager.get<Array<IChat>>(
      `chat-room:${data.roomId}`,
    );

    if (!chat) {
      // await this.cacheManager.set(`chat-room:${data.roomId}`, []);
      chat = [];
    }

    const newChat: IChat = {
      id: randomUUID(),
      date: new Date().toISOString(),
      message: data.message,
      sender: data.userId,
      roomId: data.roomId,
    };

    chat.push(newChat);

    await this.cacheManager.set(`chat-room:${data.roomId}`, chat);

    return this.server.to(data.roomId).emit('chat:new-message', {
      message: 'Received new message',
      data: newChat,
    });
  }

  async handleDisconnect() {}
}
