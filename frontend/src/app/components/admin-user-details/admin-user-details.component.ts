import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  AdminRelationUser,
  AdminService,
  AdminUserDetailsData
} from '../../services/admin.service';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-user-details.component.html',
  styleUrls: ['./admin-user-details.component.css']
})
export class AdminUserDetailsComponent implements OnInit {
  data: AdminUserDetailsData | null = null;
  loading = true;
  error = '';
  private userId = '';
  relationModalType: 'followers' | 'following' | null = null;

  get userTotalBlogs(): number {
    return this.data?.user.blogs.length ?? 0;
  }

  get userTotalLikes(): number {
    return (
      this.data?.user.blogs.reduce((total, blog) => total + (blog.likesCount || 0), 0) ?? 0
    );
  }

  get userTotalComments(): number {
    return (
      this.data?.user.blogs.reduce((total, blog) => total + (blog.commentsCount || 0), 0) ?? 0
    );
  }

  get isRelationModalOpen(): boolean {
    return this.relationModalType !== null;
  }

  get relationModalTitle(): string {
    if (this.relationModalType === 'followers') {
      return 'Followers List';
    }

    if (this.relationModalType === 'following') {
      return 'Following List';
    }

    return '';
  }

  get relationUsers(): AdminRelationUser[] {
    if (!this.data || !this.relationModalType) {
      return [];
    }

    return this.relationModalType === 'followers'
      ? this.data.user.followers
      : this.data.user.following;
  }

  constructor(
    private route: ActivatedRoute,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    const userIdFromRoute = this.route.snapshot.paramMap.get('userId');
    if (!userIdFromRoute) {
      this.error = 'Invalid user id';
      this.loading = false;
      return;
    }

    this.userId = userIdFromRoute;
    this.loadUserDetails();
  }

  loadUserDetails(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getUserDetails(this.userId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.data = response.data;
        } else {
          this.error = response.message || 'Failed to load user details';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load user details';
        this.loading = false;
      }
    });
  }

  deleteBlog(blogId: string, title: string): void {
    const confirmed = confirm(`Delete blog "${title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.adminService.deleteBlog(blogId).subscribe({
      next: () => {
        this.loadUserDetails();
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to delete blog';
      }
    });
  }

  openRelationModal(type: 'followers' | 'following'): void {
    this.relationModalType = type;
  }

  closeRelationModal(): void {
    this.relationModalType = null;
  }
}
