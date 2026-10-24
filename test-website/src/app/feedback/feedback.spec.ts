import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Feedback } from './feedback';

describe('Feedback submission', () => {
  let component: Feedback;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Feedback], providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] });
    component = TestBed.createComponent(Feedback).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  const report = { name: 'Player', email: 'player@example.com', category: 'bug', game: 'Example', subject: 'A bug', message: 'Steps to reproduce the issue.' };
  it('blocks incomplete reports before making an API request', () => {
    component.submit();
    http.expectNone('http://localhost:5014/api/feedback');
    expect(component.message()).toContain('required fields');
  });
  it('sends one request, then clears the form only after success', () => {
    component.form.setValue(report);
    component.submit();
    component.submit();
    const request = http.expectOne('http://localhost:5014/api/feedback');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(report);
    expect(request.request.withCredentials).toBeTrue();
    expect(component.success()).toBeFalse();
    request.flush({});
    expect(component.success()).toBeTrue();
    expect(component.pending()).toBeFalse();
    expect(component.form.controls.message.value).toBe('');
  });
  it('preserves the report when the server fails', () => {
    component.form.setValue(report);
    component.submit();
    http.expectOne('http://localhost:5014/api/feedback').flush({}, { status: 500, statusText: 'Server error' });
    expect(component.form.getRawValue()).toEqual(report);
    expect(component.success()).toBeFalse();
    expect(component.pending()).toBeFalse();
    expect(component.message()).toContain('could not be sent');
  });
});
