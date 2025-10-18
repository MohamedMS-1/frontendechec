// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';  // pour ngModel
import { CommonModule } from '@angular/common'; // pour ngSwitch, ngIf
import { RouterModule } from '@angular/router'; // pour router-outlet

import { AppComponent } from './app.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { LobbyComponent } from './lobby/lobby.component';
import { PlayComponent } from './play/play.component';
import { ChessboardComponent } from './play/chessboard/chessboard.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    LobbyComponent,
    PlayComponent,
    ChessboardComponent,
    // autres composants
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    // NgxChessBoardModule ? ❌ pas compatible Angular 16
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
