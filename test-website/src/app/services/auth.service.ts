import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private apiBaseUrl = 'http://localhost:5014/api/auth';

  signup(payload: SignupRequest) {
    return this.http.post<SignupResponse>(
      `${this.apiBaseUrl}/signup`,
      payload,
      { withCredentials: true }
    );
  }

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(
      `${this.apiBaseUrl}/login`,
      payload,
      { withCredentials: true }
    );
  }
}