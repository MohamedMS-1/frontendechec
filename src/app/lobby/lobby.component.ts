import { Component, OnInit } from '@angular/core';
import { Chess } from 'chess.js';
import { ChessGameService } from '../services/chess-game.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {
  players = ['Alice', 'Bob', 'Charlie'];
  board: (string | null)[][] = [];
  selectedCell: { i: number; j: number } | null = null;
  possibleMoves: { i: number; j: number }[] = [];

  username = localStorage.getItem('username') || '';
  gameStatus = 'En attente';
  currentTurn = 'Blanc';
  timer = 60;

  selectedTheme = 'Classique';
  themes = ['Classique', 'Sombre', 'Clair'];

  private chess = new Chess(); // <- Utilisation de chess.js

  constructor(private chessService: ChessGameService, private auth: AuthService) {}

  ngOnInit(): void {
    this.updateBoard();

    this.chessService.connect(this.username);

    this.chessService.players$.subscribe(list => this.players = list);

    this.chessService.onInvitation(this.username, (from) => {
      if (confirm(`${from} t’invite à jouer. Accepter ?`)) {
        this.chessService.acceptInvitation(Number(from));
      }
    });
  }

  updateBoard(): void {
    const newBoard: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    const boardState = this.chess.board();

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = boardState[i][j];
        if (piece) {
          newBoard[i][j] = `${piece.color}_${piece.type}`;
        }
      }
    }

    this.board = newBoard;
    this.currentTurn = this.chess.turn() === 'w' ? 'Blanc' : 'Noir';
  }

  get boardFlat(): (string | null)[] {
    return this.board.flat();
  }

  getRow(index: number): number {
    return Math.floor(index / 8);
  }

  getCol(index: number): number {
    return index % 8;
  }

  toSquare(i: number, j: number): string {
    return 'abcdefgh'[j] + (8 - i);
  }

  fromSquare(square: string): { i: number; j: number } {
    return {
      i: 8 - parseInt(square[1], 10),
      j: 'abcdefgh'.indexOf(square[0])
    };
  }

  getCellColor(i: number, j: number): string {
    const isSelected = this.selectedCell?.i === i && this.selectedCell?.j === j;
    const isPossible = this.possibleMoves.some(m => m.i === i && m.j === j);
    if (isSelected) return 'yellow';
    if (isPossible) return 'lightgreen';
    return (i + j) % 2 === 0 ? '#eee' : '#888';
  }

  isSelected(i: number, j: number): boolean {
    return this.selectedCell?.i === i && this.selectedCell?.j === j;
  }

  selectCell(i: number, j: number): void {
    const square = this.toSquare(i, j);
    const piece = this.chess.get(square as any);


    if (this.selectedCell) {
      const from = this.toSquare(this.selectedCell.i, this.selectedCell.j);
      const to = square;

      const legalMoves = this.chess.moves({ square: from as any, verbose: true });

      const move = legalMoves.find(m => m.to === to);

      if (move) {
        this.chess.move({ from, to });
        this.updateBoard();
        this.selectedCell = null;
        this.possibleMoves = [];
        return;
      }
    }

    if (piece && piece.color === this.chess.turn()) {
      this.selectedCell = { i, j };
      const moves = this.chess.moves({ square: square as any, verbose: true });
this.possibleMoves = moves.map((m: any) => this.fromSquare(m.to));

    } else {
      this.selectedCell = null;
      this.possibleMoves = [];
    }
  }

  confirmMove(): void {
    alert('Tous les déplacements sont appliqués directement.');
  }

  cancelMove(): void {
    this.selectedCell = null;
    this.possibleMoves = [];
  }

  resetBoard(): void {
    this.chess.reset();
    this.updateBoard();
    this.selectedCell = null;
    this.possibleMoves = [];
  }

  invite(player: string): void {
    alert(`Invitation envoyée à ${player}`);
  }

  logout(): void {
    alert('Déconnexion');
  }

  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    alert(`Thème changé en ${theme}`);
  }
}


