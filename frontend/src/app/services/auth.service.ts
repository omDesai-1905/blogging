import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import {
  User,
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  AuthResponse
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.data.user) {
          this.setCurrentUser(response.data.user, response.data.accessToken);
        }
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(response => {
        if (response.success && response.data.user) {
          this.setCurrentUser(response.data.user, response.data.accessToken);
        }
      })
    );
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearCurrentUser();
        this.router.navigate(['/login']);
      })
    );
  }

  logoutLocal(): void {
    this.clearCurrentUser();
  }

  getCurrentUser(userId: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/myProfile/${userId}`);
  }

  changePassword(data: ChangePasswordRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/change-password`, data);
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/reset-password/${token}`, { newPassword });
  }

  private setCurrentUser(user: User, token?: string): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (token) {
      localStorage.setItem('accessToken', token);
    }
    this.currentUserSubject.next(user);
  }

  private clearCurrentUser(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
