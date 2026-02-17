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

interface LikeOnPost {
  _id: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    userName: string;
    avatar?: string;
  };
  blog: {
    _id: string;
    title: string;
    slug: string;
  };
}

interface CommentOnPost {
  _id: string;
  content: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    userName: string;
    avatar?: string;
  };
  blog: {
    _id: string;
    title: string;
    slug: string;
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
  activeTab: 'posts' | 'likes' | 'comments' = 'posts';
  
  myPosts: MyPost[] = [];
  likesOnMyPosts: LikeOnPost[] = [];
  commentsOnMyPosts: CommentOnPost[] = [];
  
  isLoadingPosts = false;
  isLoadingLikes = false;
  isLoadingComments = false;

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMyPosts();
  }

  setActiveTab(tab: 'posts' | 'likes' | 'comments'): void {
    this.activeTab = tab;
    
    if (tab === 'posts' && this.myPosts.length === 0) {
      this.loadMyPosts();
    } else if (tab === 'likes' && this.likesOnMyPosts.length === 0) {
      this.loadLikesOnMyPosts();
    } else if (tab === 'comments' && this.commentsOnMyPosts.length === 0) {
      this.loadCommentsOnMyPosts();
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

  loadLikesOnMyPosts(): void {
    this.isLoadingLikes = true;
    this.userService.getLikesOnMyPosts().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.likesOnMyPosts = response.data;
        }
        this.isLoadingLikes = false;
      },
      error: (error: any) => {
        console.error('Failed to load likes on posts', error);
        this.isLoadingLikes = false;
      }
    });
  }

  loadCommentsOnMyPosts(): void {
    this.isLoadingComments = true;
    this.userService.getCommentsOnMyPosts().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.commentsOnMyPosts = response.data;
        }
        this.isLoadingComments = false;
      },
      error: (error: any) => {
        console.error('Failed to load comments on posts', error);
        this.isLoadingComments = false;
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
