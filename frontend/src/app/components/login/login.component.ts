import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      userName: [''],
      email: [''],
      password: ['', [Validators.required]]
    }, {
      validators: this.atLeastOneValidator
    });
  }

  atLeastOneValidator(group: FormGroup): { [key: string]: boolean } | null {
    const userName = group.get('userName')?.value;
    const email = group.get('email')?.value;
    
    if (!userName && !email) {
      return { atLeastOne: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter either username or email, and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData = {
      userName: this.loginForm.value.userName || undefined,
      email: this.loginForm.value.email || undefined,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = response.message || 'Login failed';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred during login';
        this.isLoading = false;
      }
    });
  }
}
