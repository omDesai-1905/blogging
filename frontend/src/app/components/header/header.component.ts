import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;
  isMenuOpen = false;
  searchQuery = '';
  searchResults: User[] = [];
  isSearching = false;
  showSearchResults = false;
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length > 0) {
          this.isSearching = true;
          return this.userService.searchUsers(query);
        } else {
          this.searchResults = [];
          this.showSearchResults = false;
          this.isSearching = false;
          return [];
        }
      })
    ).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.searchResults = response.data;
          this.showSearchResults = true;
        }
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Search failed', error);
        this.isSearching = false;
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  goToUserProfile(userName: string): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.router.navigate(['/user', userName]);
  }

  closeSearch(): void {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
      }
    });
  }
}
