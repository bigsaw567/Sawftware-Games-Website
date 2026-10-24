import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({ selector: 'app-login', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], templateUrl: './login.html' })
export class Login {
  form: FormGroup;
  readonly message = signal('');
  readonly pending = signal(false);
  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  }
  submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Please enter a valid email and password.');
      return;
    }
    this.pending.set(true);
    this.message.set('');
    this.authService.login({ email: this.form.value.email ?? '', password: this.form.value.password ?? '' }).subscribe({
      next: () => {
        this.pending.set(false);
        this.form.reset();
        this.router.navigate(['/home']);
      },
      error: () => {
        this.pending.set(false);
        this.message.set('Login failed. Check your email and password, then try again.');
      }
    });
  }
  goHome(): void { this.router.navigate(['/home']); }
}
