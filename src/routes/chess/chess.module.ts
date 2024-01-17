import { Module } from '@nestjs/common';
import { ChessGateway } from './chess.gateway';

@Module({
  imports: [],
  controllers: [],
  providers: [ChessGateway],
})
export class ChessModule {}
