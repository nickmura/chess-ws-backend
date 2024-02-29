import { Module, Session } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChessModule } from './routes/chess/chess.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisOptions } from './modules/cache';
import { ChatModule } from './routes/chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './routes/auth/auth.module';
import { UserModule } from './routes/user/user.module';
import { User } from './entities/user.entity';
import { ChessGame } from './entities/chessGame.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(RedisOptions),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: +configService.get<string>('DB_PORT'),
          password: configService.get<string>('DB_PASSWORD'),
          username: configService.get<string>('DB_USERNAME'),
          entities: [User, Session, ChessGame],
          database: configService.get<string>('DB_NAME'),
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
          ssl: Boolean(configService.get<string>('DB_SSL')),
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    ChessModule,
    ChatModule,
    AuthModule,
    UserModule,
    // dataSource
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
