import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Home } from './home/home';
import { Games } from './games/games';
import { Feedback } from './feedback/feedback';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: Login, title: 'Log In | Sawftware Games' },
  { path: 'signup', component: Signup, title: 'Join the Community | Sawftware Games' },
  { path: 'home', component: Home, title: 'Sawftware Games | Independent Games' },
  { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
  { path: 'in-development', component: Games, data: { published: false }, title: 'In Development | Sawftware Games' },
  { path: 'published', component: Games, data: { published: true }, title: 'Published Games | Sawftware Games' },
  { path: 'feedback', component: Feedback, title: 'Feedback | Sawftware Games' },
  { path: '**', redirectTo: 'home' },
];
