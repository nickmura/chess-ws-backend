export type IChessRooms = Map<
  string,
  {
    player1: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
    player2: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
    fen: string;
    turn: 'b' | 'w';
  }
>;

export type IChessRoom = {
  player1: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  player2: { userId: string | null; side: 'b' | 'w'; isConnected: boolean };
  fen: string;
  turn: 'b' | 'w';
};
