import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private apiBaseUrl = 'http://localhost:5014/api/auth'; // change to your backend port

  signup(payload: SignupRequest) {
    return this.http.post(`${this.apiBaseUrl}/signup`, payload);
  }
}