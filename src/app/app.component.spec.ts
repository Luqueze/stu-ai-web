import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  function setup(isAuthenticated: boolean): void {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    Object.defineProperty(authServiceSpy, 'isAuthenticated', { value: () => isAuthenticated });
    Object.defineProperty(authServiceSpy, 'currentUser', {
      value: () => (isAuthenticated ? { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' } : null)
    });

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    });

    fixture = TestBed.createComponent(AppComponent);
  }

  it('should create the app', () => {
    setup(false);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('hides the nav bar when the user is not authenticated', () => {
    setup(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('shows the nav bar with the user name when authenticated', () => {
    setup(true);
    fixture.detectChanges();

    const nav: HTMLElement = fixture.nativeElement.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav.textContent).toContain('Ada Lovelace');
  });
});
