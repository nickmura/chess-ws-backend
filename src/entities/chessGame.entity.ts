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

  /** id of winning user */
  @Column({ type: 'varchar' })
  winner: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
