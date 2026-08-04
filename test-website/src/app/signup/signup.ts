import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup.html'
})
export class Signup {
  form: FormGroup;
  message = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit(): void {

    if (this.form.invalid) {
      this.message = 'Please fill out all fields.';
      return;
    }

    this.authService.signup(this.form.value).subscribe({
      next: (response) => {
        console.log('Account created!', response);

        this.message = 'Account created successfully!';

        this.form.reset();

        // Optional: automatically return to the home page
        // this.router.navigate(['/home']);
      },

      error: (error) => {
        console.error(error);

        this.message = 'Failed to create account.';
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}