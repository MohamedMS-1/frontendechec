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

  // Abonnement – doit être juste ici
  this.client.subscribe(`/topic/connected-users/test`, (msg: any) => {
    console.log('📢 Utilisateurs reçus du serveur :', msg.body);
    const users = JSON.parse(msg.body);
    this.players$.next(users);
  });

  // Optionnel : récupération de la liste actuelle via HTTP
  this.http.get<string[]>(`${this.apiUrl}/connected-users/test`, { headers: this.auth.getAuthHeaders() })
    .subscribe(users => this.players$.next(users));
};


  this.client.activate();
}

  sendMove(to: string, move: string) {
    this.client.publish({ destination: '/app/move', body: JSON.stringify({ to, move }) });
  }

onMove(to: string, callback: (move: string) => void) {
  this.client.subscribe(`/topic/move/${to}`, (msg: any) => callback(msg.body));
}


private invitationSubscribed = false;

onInvitation(callback: (invitation: any) => void) {
  if (this.client && this.connected$.value && !this.invitationSubscribed) {
    this.invitationSubscribed = true;
    this.client.subscribe('/user/queue/invitations', (msg: any) => {
      const invitation = JSON.parse(msg.body);
      callback(invitation);
    });
  }

  this.connected$.subscribe(isConnected => {
    if (isConnected && this.client && !this.invitationSubscribed) {
      this.invitationSubscribed = true;
      this.client.subscribe('/user/queue/invitations', (msg: any) => {
        const invitation = JSON.parse(msg.body);
        callback(invitation);
      });
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

declineInvitation(invitationId: number) {
  this.http.post(`${this.apiUrl}/invitations/${invitationId}/decline`, {}, { headers: this.auth.getAuthHeaders() })
    .subscribe();
}

}
