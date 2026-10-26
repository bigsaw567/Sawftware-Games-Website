import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({ selector: 'app-feedback', imports: [ReactiveFormsModule], templateUrl: './feedback.html' })
export class Feedback {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  readonly pending = signal(false);
  readonly message = signal('');
  readonly success = signal(false);
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    category: ['feedback', Validators.required],
    game: ['', Validators.maxLength(150)],
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]]
  });
  submit(): void {
    if (this.pending()) return;
    this.success.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.message.set('Please complete the required fields and enter a valid email address.');
      return;
    }
    this.pending.set(true);
    this.message.set('');
    // Connect the planned feedback table through this API endpoint.
    this.http.post('/api/feedback', this.form.getRawValue(), { withCredentials: true }).subscribe({
      next: () => {
        this.pending.set(false);
        this.success.set(true);
        this.message.set('Thanks for helping us make better games. Your report has been sent.');
        this.form.reset({ category: 'feedback' });
      },
      error: () => {
        this.pending.set(false);
        this.message.set('Your report could not be sent. Please try again. Your message is still here.');
      }
    });
  }
}
