import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChessGameService {
  private client!: Client;
  public players$ = new BehaviorSubject<string[]>([]);
  public connected$ = new BehaviorSubject<boolean>(false);
  public username: string = '';

  // 👉 Remplace par ton proxy ou ngrok
  private apiUrl = 'https://unoverwhelmed-hydrobromic-ervin.ngrok-free.dev/api';

  private invitationSubscribed = false;
  private gameFinishedSubscribed = false;

  constructor(private http: HttpClient, private auth: AuthService) {}

  setUsername(name: string) {
    this.username = name;
  }

  connect(username: string) {
    const token = this.auth.getToken(); // JWT récupéré

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(`${this.apiUrl.replace('/api', '')}/ws`, null, { withCredentials: true }),
      reconnectDelay: 5000,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    this.client.onConnect = () => {
      console.log('✅ Connecté au WebSocket avec token !');
      this.client.publish({ destination: '/app/join', body: username });
      this.connected$.next(true);

      // 🔹 Abonnement utilisateurs connectés
      this.client.subscribe(`/topic/connected-users/test`, (msg: any) => {
        const users = JSON.parse(msg.body);
        this.players$.next(users);
      });

      // 🔹 Récupération initiale via REST
      this.http.get<string[]>(`${this.apiUrl}/connected-users/test`, {
        headers: this.auth.getAuthHeaders(),
        withCredentials: true,
      }).subscribe(users => this.players$.next(users));
    };

    this.client.activate();
  }

  // ----------------- Invitations -----------------
  onInvitation(callback: (invitation: any) => void) {
    if (!this.invitationSubscribed) {
      this.invitationSubscribed = true;
      this.connected$.subscribe(isConnected => {
        if (isConnected && this.client) {
          this.client.subscribe('/user/queue/invitations', (msg: any) => {
            callback(JSON.parse(msg.body));
          });
        }
      });
    }
  }

  sendInvitation(receiverUsername: string) {
    const body = { receiverUsername, gameType: 'chess' };
    this.http.post(`${this.apiUrl}/invitations/send`, body, {
      headers: this.auth.getAuthHeaders(),
      withCredentials: true,
    }).subscribe();
  }

  acceptInvitation(invitationId: number) {
    return this.http.post<any>(
      `${this.apiUrl}/invitations/${invitationId}/accept`,
      {},
      { headers: this.auth.getAuthHeaders(), withCredentials: true }
    );
  }

  declineInvitation(invitationId: number) {
    this.http.post(`${this.apiUrl}/invitations/${invitationId}/decline`, {}, {
      headers: this.auth.getAuthHeaders(),
      withCredentials: true,
    }).subscribe();
  }

  // ----------------- Moves / Game -----------------
  sendMove(to: string, move: string) {
    this.client.publish({ destination: '/app/move', body: JSON.stringify({ to, move }) });
  }

  onMove(to: string, callback: (move: string) => void) {
    this.client.subscribe(`/topic/move/${to}`, (msg: any) => callback(msg.body));
  }

  playMove(gameId: number, fromSquare: string, toSquare: string) {
    const body = { fromSquare, toSquare };
    return this.http.post<any>(`${this.apiUrl}/moves/game/${gameId}`, body, {
      headers: this.auth.getAuthHeaders(),
      withCredentials: true,
    });
  }

  listenGame(gameId: number, callback: (move: any) => void) {
    this.client.subscribe(`/topic/game/${gameId}`, (msg: any) => callback(JSON.parse(msg.body)));
  }

  onGameStart(callback: (game: any) => void) {
    this.connected$.subscribe(isConnected => {
      if (isConnected && this.client) {
        this.client.subscribe('/user/queue/game-start', (msg: any) => {
          callback(JSON.parse(msg.body));
        });
      }
    });
  }

  onGameFinished(callback: (game: any) => void) {
    this.connected$.subscribe(isConnected => {
      if (isConnected && this.client && !this.gameFinishedSubscribed) {
        this.gameFinishedSubscribed = true;
        this.client.subscribe('/user/queue/game-finished', (msg: any) => {
          const game = JSON.parse(msg.body);
          const winnerName = game.winner?.username === this.username ? 'Vous' : game.winner?.username;
          alert(`🏆 Partie terminée ! Gagnant : ${winnerName}`);
          callback(game);
        });
      }
    });
  }
}
