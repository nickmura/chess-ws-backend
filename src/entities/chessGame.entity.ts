import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'chessGames' })
export class ChessGame extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar' })
  fen: string;

  @Column({ type: 'jsonb' })
  player1: {
    id: string;
    side: 'w' | 'b';
  };

  @Column({ type: 'jsonb' })
  player2: {
    id: string;
    side: 'w' | 'b';
  };

  @Column({ type: 'float' })
  wager: number;

  /** id of winning user or null when game was a draw*/
  @Column({ type: 'varchar', nullable: true })
  winner: string;

  @Column({ type: 'varchar', nullable: true })
  index: string;

  @Column({ type: 'jsonb' })
  txns: Array<{
    player: string;
    txnId: string;
    action: 'collect-win' | 'collect-draw' | 'avert-game' | 'end-game';
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
