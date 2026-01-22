import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

interface MyPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  category: string;
  createdAt: Date;
  likesCount?: number;
  commentsCount?: number;
}

interface LikedPost {
  _id: string;
  title: string;
  slug: string;
  image: string;
  category: string;
  createdAt: Date;
  likedAt: Date;
  author: {
    _id: string;
    name: string;
    userName: string;
  };
}

interface MyComment {
  _id: string;
  content: string;
  createdAt: Date;
  blog: {
    _id: string;
    title: string;
    slug: string;
  };
  blogAuthor: {
    name: string;
    userName: string;
  };
}

interface FollowerUser {
  _id: string;
  name: string;
  userName: string;
  avatar?: string;
  followedAt: Date;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  isPrivate = false;
  isUpdating = false;
  message = '';
  
  activeTab: 'privacy' | 'posts' | 'likes' | 'comments' = 'privacy';
  
  myPosts: MyPost[] = [];
  myLikedPosts: LikedPost[] = [];
  myComments: MyComment[] = [];
  
  isLoadingPosts = false;
  isLoadingLikes = false;
  isLoadingComments = false;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.isPrivate = currentUser.isPrivate || false;
    }
    this.loadMyPosts();
  }

  setActiveTab(tab: 'privacy' | 'posts' | 'likes' | 'comments'): void {
    this.activeTab = tab;
    
    if (tab === 'posts' && this.myPosts.length === 0) {
      this.loadMyPosts();
    } else if (tab === 'likes' && this.myLikedPosts.length === 0) {
      this.loadMyLikedPosts();
    } else if (tab === 'comments' && this.myComments.length === 0) {
      this.loadMyComments();
    }
  }

  loadMyPosts(): void {
    this.isLoadingPosts = true;
    this.userService.getMyPosts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.myPosts = response.data;
        }
        this.isLoadingPosts = false;
      },
      error: (error) => {
        console.error('Failed to load posts', error);
        this.isLoadingPosts = false;
      }
    });
  }

  loadMyLikedPosts(): void {
    this.isLoadingLikes = true;
    this.userService.getMyLikedPosts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.myLikedPosts = response.data;
        }
        this.isLoadingLikes = false;
      },
      error: (error) => {
        console.error('Failed to load liked posts', error);
        this.isLoadingLikes = false;
      }
    });
  }

  loadMyComments(): void {
    this.isLoadingComments = true;
    this.userService.getMyComments().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.myComments = response.data;
        }
        this.isLoadingComments = false;
      },
      error: (error) => {
        console.error('Failed to load comments', error);
        this.isLoadingComments = false;
      }
    });
  }

  togglePrivacy(): void {
    this.isUpdating = true;
    this.message = '';

    this.userService.toggleAccountPrivacy().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.isPrivate = response.data.isPrivate;
          this.message = response.message || 'Privacy settings updated successfully';
          
          // Update current user in auth service
          const currentUser = this.authService.currentUserValue;
          if (currentUser) {
            currentUser.isPrivate = this.isPrivate;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
          }
        }
        this.isUpdating = false;
      },
      error: (error) => {
        this.message = error.error?.message || 'Failed to update privacy settings';
        this.isUpdating = false;
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }
}
