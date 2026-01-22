import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Blog } from '../../models/blog.model';

interface UserProfile {
  userId: string;
  name: string;
  userName: string;
  avatar?: string;
  isPrivate?: boolean;
  followers: number;
  following: number;
  isFollowing: boolean;
  followRequestStatus?: 'pending' | 'accepted' | null;
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
  isLoading = false;
  isLoadingPosts = false;
  errorMessage = '';
  isAuthenticated = false;
  currentUserId = '';
  isTogglingFollow = false;
  
  // Modal related properties
  showModal = false;
  isLoadingModal = false;
  modalTitle = '';
  modalEmptyMessage = '';
  modalUsers: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
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
            isFollowing: this.userProfile.isFollowing,
            followRequestStatus: this.userProfile.followRequestStatus,
            isPrivate: this.userProfile.isPrivate
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
      isFollowing: this.userProfile.isFollowing,
      followRequestStatus: this.userProfile.followRequestStatus
    });

    // If already following (status = accepted), unfollow
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
    // If request is pending, cancel it
    else if (this.userProfile.followRequestStatus === 'pending') {
      console.log('ACTION: Canceling pending request...');
      this.userService.cancelFollowRequest(profileUserId).subscribe({
        next: (response) => {
          console.log('Cancel request SUCCESS:', response);
          this.loadUserProfile();
          this.isTogglingFollow = false;
        },
        error: (error) => {
          console.error('Cancel request ERROR:', error);
          alert('Failed to cancel request: ' + (error.error?.message || error.message));
          this.isTogglingFollow = false;
        }
      });
    }
    // Otherwise, send follow request (will be pending if private, accepted if public)
    else {
      console.log('ACTION: Sending follow request...');
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
    
    if (this.userProfile.isFollowing) {
      return 'Unfollow';
    } else if (this.userProfile.followRequestStatus === 'pending') {
      return 'Requested';
    } else {
      return 'Follow';
    }
  }

  getFollowButtonClass(): string {
    if (!this.userProfile) return 'btn-primary';
    
    if (this.userProfile.isFollowing) {
      return 'btn-secondary';
    } else if (this.userProfile.followRequestStatus === 'pending') {
      return 'btn-warning';
    } else {
      return 'btn-primary';
    }
  }

  isPrivateAndNotFollowing(): boolean {
    if (!this.userProfile) return false;
    
    // If it's the user's own profile, always show posts
    if (this.isOwnProfile()) return false;
    
    // If the account is private and user is not following (accepted status), hide posts
    return this.userProfile.isPrivate === true && !this.userProfile.isFollowing;
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
}
