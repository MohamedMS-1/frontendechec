import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-chessboard',
  templateUrl: './chessboard.component.html',
  styleUrls: ['./chessboard.component.css']
})
export class ChessboardComponent {
  @Output() moveChange = new EventEmitter<string>();

  board: string[][] = Array(8).fill(null).map(() => Array(8).fill(''));

  onCellClick(row: number, col: number) {
    this.moveChange.emit(`${row}-${col}`);
  }
}

