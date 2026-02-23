import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { BlogService } from '../../services/blog.service';
import { User } from '../../models/user.model';
import { Blog } from '../../models/blog.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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
  searchResults: any[] = [];
  showSearchResults = false;
  isSearching = false;
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private blogService: BlogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Setup search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateToSearch(): void {
    this.showSearchResults = false;
    if (this.searchQuery.trim()) {
      this.router.navigate(['/blogs']);
    }
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  performSearch(query: string): void {
    const searchTerm = query.trim();
    
    if (!searchTerm) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    this.isSearching = true;
    this.searchResults = [];

    // Search users
    this.userService.searchUsers(searchTerm).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const users = response.data.slice(0, 3).map((user: User) => ({
            type: 'user',
            data: user,
            title: user.name,
            subtitle: '@' + user.userName
          }));
          this.searchResults = [...this.searchResults, ...users];
        }
        this.checkSearchComplete();
      },
      error: () => {
        this.checkSearchComplete();
      }
    });

    // Search blogs
    this.blogService.getAllBlogs(1).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const blogs = response.data
            .filter((blog: Blog) => 
              blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              blog.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 4)
            .map((blog: Blog) => ({
              type: 'blog',
              data: blog,
              title: blog.title,
              subtitle: 'By @' + (blog.user?.userName || 'Unknown')
            }));
          this.searchResults = [...this.searchResults, ...blogs];
        }
        this.checkSearchComplete();
      },
      error: () => {
        this.checkSearchComplete();
      }
    });
  }

  checkSearchComplete(): void {
    this.isSearching = false;
    this.showSearchResults = this.searchResults.length > 0;
  }

  selectResult(result: any): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;

    if (result.type === 'user') {
      this.router.navigate(['/user', result.data.userName]);
    } else if (result.type === 'blog') {
      this.router.navigate(['/blog', result.data._id]);
    }
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
        // Clear user data locally even if backend call fails
        this.authService.logoutLocal();
        this.router.navigate(['/login']);
      }
    });
  }
}
