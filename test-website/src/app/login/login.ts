import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html'
})
export class Login {
  form: FormGroup;
  message = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.message = 'Please enter a valid email and password.';
      return;
    }

    const payload = {
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? ''
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.message = `Welcome, ${response.name}!`;
        this.form.reset();

        // Change this route if your home route is different
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error(error);
        this.message = 'Login failed. Check your email and password.';
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}