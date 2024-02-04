import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
  constructor(private cacheManager: Cache) {}
}
