import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  signup() {
    this.auth.signup({ username: this.username, password: this.password, role: 'ROLE_USER' })
      .subscribe({
        next: () => {
          alert('Inscription réussie ! Connectez-vous.');
          this.router.navigate(['/login']); // Redirection vers login
        },
        error: (err) => {
          alert('Erreur d’inscription : ' + err.error.message || err.message);
        }
      });
  }
}
