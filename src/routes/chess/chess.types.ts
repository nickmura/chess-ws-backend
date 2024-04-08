export type IChessRoom = {
  player1: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  player2: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  fen: string;
  turn: 'b' | 'w';
  stake: number;
  onlineCount: number;
  roomId: string;
  index?: string;
  txns: Array<{
    player: string;
    txnId: string;
    action: 'collect-win' | 'collect-draw' | 'avert-game' | 'end-game';
  }>;
};
