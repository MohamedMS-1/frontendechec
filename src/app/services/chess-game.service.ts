import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Client, IMessage } from '@stomp/stompjs'; // IMessage est l'interface correcte pour les messages
import { Message } from '@stomp/stompjs';

@Injectable({ providedIn: 'root' })
export class ChessGameService {
  private client!: InstanceType<typeof Client>;
  public players$ = new BehaviorSubject<string[]>([]);
  private apiUrl = 'http://localhost:8080/api';
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private auth: AuthService) {}

connect(username: string) {
  const token = this.auth.getToken(); // récupère ton JWT

  this.client = new Client({
    webSocketFactory: () => new SockJS(`${this.apiUrl.replace('/api', '')}/ws`),
    reconnectDelay: 5000,
    connectHeaders: { Authorization: `Bearer ${token}` } // <-- ici
  });

  this.client.onConnect = () => {
    console.log('✅ Connecté au WebSocket avec token !');
    this.client.publish({ destination: '/app/join', body: username });
    this.connected$.next(true);

    this.client.subscribe(`/topic/connected-users/test`, (msg: any) => {
      const users = JSON.parse(msg.body);
      console.log('📢 Utilisateurs reçus du serveur :', users);
      this.players$.next(users);
    });
  };

  this.client.activate();
}

  sendMove(to: string, move: string) {
    this.client.publish({ destination: '/app/move', body: JSON.stringify({ to, move }) });
  }

onMove(to: string, callback: (move: string) => void) {
  this.client.subscribe(`/topic/move/${to}`, (msg: any) => callback(msg.body));
}


onInvitation(to: string, callback: (from: string) => void) {
  this.connected$.subscribe(isConnected => {
    if (isConnected && this.client) {
      this.client.subscribe(`/topic/invite/${to}`, (msg: any) => callback(msg.body));
    }
  });
}


  sendInvitation(receiverUsername: string) {
  const body = { receiverUsername, gameType: 'chess' };
  this.http.post(`${this.apiUrl}/invitations/send`, body, { headers: this.auth.getAuthHeaders() })
    .subscribe();
}

acceptInvitation(invitationId: number) {
  this.http.post(`${this.apiUrl}/invitations/${invitationId}/accept`, {}, { headers: this.auth.getAuthHeaders() })
    .subscribe();
}

}
