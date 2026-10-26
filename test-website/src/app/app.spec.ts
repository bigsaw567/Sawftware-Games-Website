import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './services/auth.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('replaces account links with the profile after a successful login', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/login"]')).toBeTruthy();
    expect(element.querySelector('.profile-menu')).toBeNull();

    TestBed.inject(AuthService).login({ email: 'player@example.com', password: 'password' }).subscribe();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/login').flush({ id: 1, name: 'Player', email: 'player@example.com' });
    fixture.detectChanges();

    expect(element.querySelector('a[href="/login"]')).toBeNull();
    expect(element.querySelector('a[href="/signup"]')).toBeNull();
    expect(element.querySelector('.profile-icon')?.getAttribute('aria-label')).toBe('Profile for Player');
    expect(element.querySelector('.profile-card')?.textContent).toContain('player@example.com');
    http.verify();
  });

  it('keeps the account links when login fails', () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(AuthService).login({ email: 'player@example.com', password: 'incorrect' }).subscribe({ error: () => {} });
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a[href="/login"]')).toBeTruthy();
    expect(element.querySelector('.profile-menu')).toBeNull();
    http.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should keep the studio navigation outside the routed content', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('header .brand')?.textContent).toContain('SAWFTWARE');
    expect(compiled.querySelectorAll('nav a').length).toBe(6);
    expect(compiled.querySelector('main router-outlet')).toBeTruthy();
  });
});
