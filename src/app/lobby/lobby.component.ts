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
  invitationModalVisible = false;
  currentInvitation: any = null;

  selectedTheme = 'Classique';
  themes = ['Classique', 'Sombre', 'Clair'];

  invitationSentModalVisible = false;
  invitedPlayer: string | null = null;

  playerColor: 'white' | 'black' | null = null;
  gameId: number | null = null;
  myGames: any[] = [];


  private chess = new Chess(); // <- Utilisation de chess.js

  constructor(private chessService: ChessGameService, private auth: AuthService) {
       this.chessService.connected$.subscribe(isConnected => {
      if (isConnected && this.gameId) {
         this.subscribeToGame(this.gameId);
      }
   });
  }

  private subscribeToGame(id: number) {
  this.chessService.listenGame(id, (move: any) => {
    console.log("♟ Coup reçu (temps réel)", move);

    const from = move.fromSquare;
    const to = move.toSquare;

    this.chess.move({ from, to });
    this.updateBoard();
  });
}


ngOnInit(): void {
  this.updateBoard();

  this.chessService.connect(this.username);

  this.chessService.onGameStart((game) => {
  console.log("🎮 Partie reçue en temps réel :", game);

  this.gameId = game.id;
  this.chess.load(game.fen || this.chess.fen());
  this.updateBoard();

  if (game.playerWhite?.username === this.username) {
    this.playerColor = 'white';
  } else if (game.playerBlack?.username === this.username) {
    this.playerColor = 'black';
  }

  console.log("🎨 Vous jouez :", this.playerColor);

  // Commencer l'écoute des coups en temps réel
  if (this.gameId) {
    this.subscribeToGame(this.gameId);
  }
});

  // ✅ Abonnement WebSocket des joueurs connectés
  this.chessService.players$.subscribe(list => this.players = list);

  

  // ✅ Réception d’invitation
  this.chessService.onInvitation(invitation => {
    console.log('📨 Invitation reçue:', invitation);
    this.currentInvitation = invitation;
    this.invitationModalVisible = true;
  });

  // ✅ Récupération de mes parties depuis l'API
  this.chessService.getMyGames().subscribe({
    next: (games) => {
      console.log("🎯 Parties récupérées :", games);

      // 🕒 On filtre uniquement les parties créées aujourd’hui
      const today = new Date().toISOString().split('T')[0]; // ex: "2025-11-02"
      const gamesToday = games.filter(g =>
        g.createdAt.startsWith(today)
      );

      console.log("📅 Parties d'aujourd'hui :", gamesToday);

      // 🧩 Sélection de la partie du jour (si plusieurs, on prend la plus récente)
      const myGame = gamesToday.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      if (myGame) {
        this.myGames = [myGame];
        this.gameId = myGame.id;
        this.chess.load(myGame.fen || this.chess.fen());
        this.updateBoard();

        // 🎨 Déterminer la couleur du joueur courant
        if (myGame.playerWhite?.username === this.username) {
          this.playerColor = 'white';
        } else if (myGame.playerBlack?.username === this.username) {
          this.playerColor = 'black';
        }

        console.log("🟢 Partie du jour chargée :", myGame);
        console.log("🎨 Vous jouez :", this.playerColor);

             // 4️⃣ Écoute des coups adverses par WebSocket
        this.chessService.listenGame(myGame.id, (move: any) => {
          console.log("♟ Coup reçu du WebSocket :", move);

          const from = move.fromSquare;
          const to = move.toSquare;

          // appliquer le coup de l'adversaire
          this.chess.move({ from, to });
          this.updateBoard();
          
        });


      } else {
        console.warn("⚠️ Aucune partie du jour trouvée pour l'utilisateur :", this.username);
      }
    },
    error: (err) => {
      console.error("❌ Erreur lors du chargement des parties :", err);
    }
  });

  // Abonnement aux parties terminées
this.chessService.onGameFinished((game: any) => {
  let winnerName = '';
  if (game.winner?.username === this.username) {
    winnerName = 'Vous';
  } else {
    winnerName = game.winner?.username;
  }

  alert(`🏆 Partie terminée ! Gagnant : ${winnerName}`);
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

  isPlayerPiece(pieceColor: 'w' | 'b'): boolean {
  return (this.playerColor === 'white' && pieceColor === 'w') ||
         (this.playerColor === 'black' && pieceColor === 'b');
}

isPlayerTurn(): boolean {
  return (this.playerColor === 'white' && this.chess.turn() === 'w') ||
         (this.playerColor === 'black' && this.chess.turn() === 'b');
}


selectCell(i: number, j: number): void {
  const square = this.toSquare(i, j);
  const piece = this.chess.get(square as any);

  // 🛑 Vérifie si c’est ton tour
  if (!this.isPlayerTurn()) {
    console.warn("🚫 Ce n’est pas ton tour !");
    return;
  }

  // 🛑 Vérifie que la pièce cliquée t’appartient
 

  // 🧩 Si une case est déjà sélectionnée, essaie de déplacer
  if (this.selectedCell) {
    const from = this.toSquare(this.selectedCell.i, this.selectedCell.j);
    const to = square;

    const legalMoves = this.chess.moves({ square: from as any, verbose: true });
    const move = legalMoves.find(m => m.to === to);

    if (move) {
      // 🔒 Vérifie encore avant de déplacer
      const pieceFrom = this.chess.get(from as any);
      if (!pieceFrom || !this.isPlayerPiece(pieceFrom.color)) {
        console.warn("🚫 Tu ne peux pas bouger la pièce adverse !");
        return;
      }

      // ✅ Mouvement autorisé
      this.chess.move({ from, to });
      this.updateBoard();

      /*  ⭐⭐⭐ ENVOI AU BACKEND ⭐⭐⭐ */
      if (this.gameId) {
        this.chessService.playMove(this.gameId, from, to).subscribe({
          next: response => {
            console.log("✔ Coup envoyé au serveur :", response);
          },
          error: err => {
            console.error("❌ Coup refusé :", err.error.message);
            // rollback
            this.chess.undo();
            this.updateBoard();
          }
        });
      }
      /*  ⭐⭐⭐ FIN ⭐⭐⭐ */


      this.selectedCell = null;
      this.possibleMoves = [];
      return;
    }
  }

  // 🟢 Sélection d’une de tes pièces
  if (piece && this.isPlayerPiece(piece.color)) {
    this.selectedCell = { i, j };
    const moves = this.chess.moves({ square: square as any, verbose: true });
    this.possibleMoves = moves.map((m: any) => this.fromSquare(m.to));
  } else {
    // 🔴 Clique sur une case vide ou une pièce adverse = déselection
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
    //alert(`Invitation envoyée à ${player}`);
     this.chessService.sendInvitation(player);
     this.invitedPlayer = player;
     this.invitationSentModalVisible = true;
  }

  logout(): void {
    alert('Déconnexion');
  }

  changeTheme(theme: string): void {
    this.selectedTheme = theme;
    alert(`Thème changé en ${theme}`);
  }

  /*
  acceptInvitation() {
    if (this.currentInvitation) {
      this.chessService.acceptInvitation(this.currentInvitation.id);
      this.closeInvitationModal();
    }
  }
*/

acceptInvitation() {
  if (this.currentInvitation) {
    this.chessService.acceptInvitation(this.currentInvitation.id).subscribe();
    this.closeInvitationModal();
  }
}



  declineInvitation() {
    // Ici tu peux envoyer un refus via HTTP ou WebSocket si nécessaire
    if (this.currentInvitation) {
      this.chessService.declineInvitation(this.currentInvitation.id);
      this.closeInvitationModal();
    }
  }

  closeInvitationModal() {
    this.invitationModalVisible = false;
    this.currentInvitation = null;
  
  }

  closeInvitationSentModal(): void {
    this.invitationSentModalVisible = false;
    this.invitedPlayer = null;
  }


  
}


