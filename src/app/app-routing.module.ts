import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { LobbyComponent } from './lobby/lobby.component';
import { PlayComponent } from './play/play.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' }, // Page d’accueil
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'lobby', component: LobbyComponent },
  { path: 'play', component: PlayComponent },
  { path: '**', redirectTo: 'login' } // Redirection si route inconnue
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
