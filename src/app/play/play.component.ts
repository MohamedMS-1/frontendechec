import { Component, OnInit } from '@angular/core';
import { ChessGameService } from '../services/chess-game.service';

@Component({
  selector: 'app-play',
  templateUrl: './play.component.html'
})
export class PlayComponent implements OnInit {
  username = localStorage.getItem('username') || '';

  constructor(private chessService: ChessGameService) {}

  ngOnInit() {
    this.chessService.onMove(this.username, (move: string) => {
      console.log('Mouvement adversaire :', move);
      // Mettre à jour ngx-chess-board ici
    });
  }

  onMove(move: string) {
    console.log("Move reçu:", move);
  }
}
