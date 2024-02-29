import { Module } from '@nestjs/common';
import { ChessGateway } from './chess.gateway';
import { ChessService } from './chess.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChessGame } from 'src/entities/chessGame.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChessGame])],
  controllers: [],
  providers: [ChessGateway, ChessService],
})
export class ChessModule {}
