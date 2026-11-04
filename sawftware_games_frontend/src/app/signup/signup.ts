import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({ selector: 'app-signup', standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], templateUrl: './signup.html' })
export class Signup {
  form: FormGroup;
  readonly message = signal('');
  readonly pending = signal(false);
  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({ name: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  }
  submit(): void {
    if (this.pending()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Please fill out all fields and enter a valid email address.');
      return;
    }
    this.pending.set(true);
    this.message.set('');
    this.authService.signup(this.form.value).subscribe({
      next: () => {
        this.pending.set(false);
        this.message.set('Account created! You can now log in using the link below.');
        this.form.reset();
      },
      error: () => {
        this.pending.set(false);
        this.message.set('Failed to create account. Please try again.');
      }
    });
  }
  goHome(): void { this.router.navigate(['/home']); }
}
