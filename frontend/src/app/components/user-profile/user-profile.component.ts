import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Blog } from '../../models/blog.model';

interface UserProfile {
  userId: string;
  name: string;
  userName: string;
  avatar?: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  isFollowedByUser?: boolean;
  posts: number;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  userName: string = '';
  userProfile: UserProfile | null = null;
  userPosts: Blog[] = [];
  likesOnPosts: any[] = [];
  commentsOnPosts: any[] = [];
  isLoading = false;
  isLoadingPosts = false;
  errorMessage = '';
  isAuthenticated = false;
  currentUserId = '';
  isTogglingFollow = false;
  activeTab: 'posts' | 'liked' | 'comments' = 'posts';
  
  // Modal related properties
  showModal = false;
  isLoadingModal = false;
  modalTitle = '';
  modalEmptyMessage = '';
  modalUsers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private blogService: BlogService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUserId = this.authService.currentUserValue?._id || '';
    
    this.route.params.subscribe(params => {
      this.userName = params['userName'];
      if (this.userName) {
        this.loadUserProfile();
        this.loadUserPosts();
      }
    });
  }

  loadUserProfile(): void {
    console.log('Loading user profile for:', this.userName);
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getUserProfile(this.userName).subscribe({
      next: (response) => {
        console.log('Profile loaded successfully:', response);
        if (response.success && response.data) {
          this.userProfile = response.data as any as UserProfile;
          console.log('User profile state:', {
            isFollowing: this.userProfile.isFollowing
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.errorMessage = error.error?.message || 'Failed to load user profile';
        this.isLoading = false;
      }
    });
  }

  loadUserPosts(): void {
    this.isLoadingPosts = true;
    
    this.userService.getUserPosts(this.userName).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as any;
          if (data.AllPosts) {
            this.userPosts = data.AllPosts;
          }
        }
        this.isLoadingPosts = false;
      },
      error: (error) => {
        console.error('Failed to load user posts', error);
        this.isLoadingPosts = false;
      }
    });
  }

  loadLikesOnPosts(): void {
    if (!this.isOwnProfile()) {
      return;
    }
    
    this.isLoadingPosts = true;
    this.userService.getLikesOnMyPosts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.likesOnPosts = response.data;
        }
        this.isLoadingPosts = false;
      },
      error: (error) => {
        console.error('Failed to load likes on posts', error);
        this.isLoadingPosts = false;
      }
    });
  }

  loadCommentsOnPosts(): void {
    if (!this.isOwnProfile()) {
      return;
    }
    
    this.isLoadingPosts = true;
    this.userService.getCommentsOnMyPosts().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.commentsOnPosts = response.data;
        }
        this.isLoadingPosts = false;
      },
      error: (error) => {
        console.error('Failed to load comments on posts', error);
        this.isLoadingPosts = false;
      }
    });
  }

  switchTab(tab: 'posts' | 'liked' | 'comments'): void {
    this.activeTab = tab;
    
    if (tab === 'posts' && this.userPosts.length === 0) {
      this.loadUserPosts();
    } else if (tab === 'liked' && this.likesOnPosts.length === 0) {
      this.loadLikesOnPosts();
    } else if (tab === 'comments' && this.commentsOnPosts.length === 0) {
      this.loadCommentsOnPosts();
    }
  }

  toggleFollow(): void {
    console.log('=== FOLLOW BUTTON CLICKED ===');
    console.log('isAuthenticated:', this.isAuthenticated);
    console.log('userProfile:', this.userProfile);
    console.log('isTogglingFollow:', this.isTogglingFollow);
    
    if (!this.isAuthenticated) {
      console.error('User not authenticated');
      alert('Please login to follow users');
      return;
    }
    
    if (!this.userProfile) {
      console.error('No user profile loaded');
      return;
    }
    
    if (this.isTogglingFollow) {
      console.log('Already processing a follow request');
      return;
    }

    this.isTogglingFollow = true;
    const profileUserId = this.userProfile.userId;
    
    console.log('Profile User ID:', profileUserId);
    console.log('Current Follow Status:', {
      isFollowing: this.userProfile.isFollowing
    });

    // If already following, unfollow
    if (this.userProfile.isFollowing) {
      console.log('ACTION: Unfollowing user...');
      this.userService.unfollowUser(profileUserId).subscribe({
        next: (response) => {
          console.log('Unfollow SUCCESS:', response);
          this.loadUserProfile();
          this.isTogglingFollow = false;
        },
        error: (error) => {
          console.error('Unfollow ERROR:', error);
          alert('Failed to unfollow: ' + (error.error?.message || error.message));
          this.isTogglingFollow = false;
        }
      });
    } 
    // Otherwise, follow the user
    else {
      console.log('ACTION: Following user...');
      this.userService.followUser(profileUserId).subscribe({
        next: (response) => {
          console.log('Follow SUCCESS:', response);
          this.loadUserProfile();
          this.isTogglingFollow = false;
        },
        error: (error) => {
          console.error('Follow ERROR:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.error?.message,
            url: error.url
          });
          // Even on error, reload profile to get current status
          this.loadUserProfile();
          this.isTogglingFollow = false;
          
          // Show alert for errors (except "already sent")
          if (!error.error?.message?.includes('already')) {
            alert('Failed to follow: ' + (error.error?.message || error.message));
          }
        }
      });
    }
  }

  getFollowButtonText(): string {
    if (!this.userProfile) return 'Follow';
    
    return this.userProfile.isFollowing ? 'Unfollow' : 'Follow';
  }

  getFollowButtonClass(): string {
    if (!this.userProfile) return 'btn-primary';
    
    return this.userProfile.isFollowing ? 'btn-secondary' : 'btn-primary';
  }

  truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  isOwnProfile(): boolean {
    const currentUser = this.authService.currentUserValue;
    return currentUser?.userName === this.userName;
  }

  showFollowersList(): void {
    this.modalTitle = 'Followers';
    this.modalEmptyMessage = 'No followers yet';
    this.showModal = true;
    this.isLoadingModal = true;
    this.modalUsers = [];

    this.userService.getUserProfile(this.userName).subscribe({
      next: () => {
        // Load followers through a separate endpoint if available
        // For now, we'll use getMyFollowers if it's the current user's profile
        if (this.isOwnProfile()) {
          this.userService.getMyFollowers().subscribe({
            next: (response) => {
              this.modalUsers = response.data || [];
              this.isLoadingModal = false;
            },
            error: (error) => {
              console.error('Failed to load followers', error);
              this.isLoadingModal = false;
            }
          });
        } else {
          this.isLoadingModal = false;
          this.modalEmptyMessage = 'Cannot view followers of other users';
        }
      }
    });
  }

  showFollowingList(): void {
    this.modalTitle = 'Following';
    this.modalEmptyMessage = 'Not following anyone yet';
    this.showModal = true;
    this.isLoadingModal = true;
    this.modalUsers = [];

    this.userService.getUserProfile(this.userName).subscribe({
      next: () => {
        // Load following through a separate endpoint if available
        // For now, we'll use getMyFollowing if it's the current user's profile
        if (this.isOwnProfile()) {
          this.userService.getMyFollowing().subscribe({
            next: (response) => {
              this.modalUsers = response.data || [];
              this.isLoadingModal = false;
            },
            error: (error) => {
              console.error('Failed to load following', error);
              this.isLoadingModal = false;
            }
          });
        } else {
          this.isLoadingModal = false;
          this.modalEmptyMessage = 'Cannot view following of other users';
        }
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.modalUsers = [];
  }

  deleteBlog(blog: Blog): void {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) {
      return;
    }

    this.blogService.deleteBlog(blog._id).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove the blog from the local array
          this.userPosts = this.userPosts.filter(p => p._id !== blog._id);
          // Update the post count
          if (this.userProfile) {
            this.userProfile.posts = Math.max(0, this.userProfile.posts - 1);
          }
        }
      },
      error: (error) => {
        alert('Failed to delete blog: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  editBlog(blog: Blog): void {
    this.router.navigate(['/blog/edit', blog._id]);
  }
}
