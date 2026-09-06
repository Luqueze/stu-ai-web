import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/profile/profile.service';
import { ApiKeyResponse } from '../../core/profile/profile.models';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let profileServiceSpy: jasmine.SpyObj<ProfileService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const savedKey: ApiKeyResponse = {
    id: 'key-1',
    provider: 'openai',
    createdAt: new Date().toISOString()
  };

  function setup(): void {
    profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', ['listApiKeys', 'saveApiKey']);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    Object.defineProperty(authServiceSpy, 'currentUser', {
      value: () => ({ id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com', role: 'STUDENT' })
    });

    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: ProfileService, useValue: profileServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  }

  it('loads saved API keys on init', () => {
    setup();
    profileServiceSpy.listApiKeys.and.returnValue(of([savedKey]));

    fixture.detectChanges();

    expect(component.apiKeys()).toEqual([savedKey]);
    expect(component.isLoading()).toBeFalse();
  });

  it('does not call saveApiKey() when the form is invalid', () => {
    setup();
    profileServiceSpy.listApiKeys.and.returnValue(of([]));
    fixture.detectChanges();

    component.form.patchValue({ apiKey: '' });
    component.onSubmit();

    expect(profileServiceSpy.saveApiKey).not.toHaveBeenCalled();
  });

  it('saves the API key, clears the field and reloads the list on success', () => {
    setup();
    profileServiceSpy.listApiKeys.and.returnValue(of([]));
    fixture.detectChanges();

    profileServiceSpy.saveApiKey.and.returnValue(of(savedKey));
    component.form.setValue({ provider: 'openai', apiKey: 'sk-test' });

    component.onSubmit();

    expect(profileServiceSpy.saveApiKey).toHaveBeenCalledWith({ provider: 'openai', apiKey: 'sk-test' });
    expect(component.form.controls.apiKey.value).toBe('');
    expect(component.successMessage()).toBe('API key for openai saved.');
    expect(profileServiceSpy.listApiKeys).toHaveBeenCalledTimes(2);
  });

  it('sets an error message when saving fails', () => {
    setup();
    profileServiceSpy.listApiKeys.and.returnValue(of([]));
    fixture.detectChanges();

    profileServiceSpy.saveApiKey.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'API key is required' } }))
    );
    component.form.setValue({ provider: 'openai', apiKey: 'sk-test' });

    component.onSubmit();

    expect(component.errorMessage()).toBe('API key is required');
  });
});
