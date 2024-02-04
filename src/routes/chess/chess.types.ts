export type IChessRoom = {
  player1: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  player2: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  fen: string;
  turn: 'b' | 'w';
  stake: number;
  onlineCount: number;
  roomId: string;
};
