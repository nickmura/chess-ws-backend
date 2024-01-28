import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChessModule } from './routes/chess/chess.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { RedisOptions } from './modules/cache';

@Module({
  imports: [
    //     CacheModule.registerAsync<RedisClientOptions>({
    // useFactory: () => redisStore,
    //       // Store-specific configuration:
    //       // host: 'localhost',
    //       // port: 6379,

    //     }),
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    ChessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
