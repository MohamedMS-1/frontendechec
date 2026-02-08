import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://192.168.100.55:4200/api/auth';
  //private apiUrl = 'https://unoverwhelmed-hydrobromic-ervin.ngrok-free.dev/api/auth'

  constructor(private http: HttpClient) {}

  signup(data: { username: string; password: string; role: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  login(data: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }

  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAuthHeaders(): HttpHeaders {
  return new HttpHeaders({ 
    Authorization: `Bearer ${this.getToken()}`,
    'ngrok-skip-browser-warning': '1'  // <-- Ajout ici
  });
}
}
