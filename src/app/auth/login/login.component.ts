import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    this.auth.login({ username: this.username, password: this.password })
      .subscribe({
        next: (res: any) => {
          this.auth.saveToken(res.token);
          localStorage.setItem('username', this.username);
          this.router.navigate(['/lobby']); // Navigation vers le lobby
        },
        error: (err) => {
          alert('Erreur de connexion : ' + err.error.message || err.message);
        }
      });
  }
}
