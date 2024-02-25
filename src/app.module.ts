import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChessModule } from './routes/chess/chess.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { RedisOptions } from './modules/cache';
import { ChatModule } from './routes/chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './routes/auth/auth.module';
import { dataSourceOptions } from './modules/dataSource';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    TypeOrmModule.forRoot(dataSourceOptions),
    ChessModule,
    ChatModule,
    AuthModule,
    // dataSource
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
