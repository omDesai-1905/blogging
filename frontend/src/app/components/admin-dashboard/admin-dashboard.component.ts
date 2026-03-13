import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminDashboardData, AdminUserActivity } from '../../services/admin.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  dashboardData: AdminDashboardData | null = null;
  loading = true;
  error = '';
  userSearchTerm = '';
  blogSearchTerm = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getDashboard().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dashboardData = response.data;
        } else {
          this.error = response.message || 'Unable to load admin dashboard';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = error?.error?.message || 'Failed to load admin dashboard';
        this.loading = false;
      }
    });
  }

  filteredUsers(): AdminUserActivity[] {
    const users = this.dashboardData?.users || [];
    const userTerm = this.userSearchTerm.trim().toLowerCase();
    const blogTerm = this.blogSearchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const userMatches =
        !userTerm ||
        user.name.toLowerCase().includes(userTerm) ||
        user.userName.toLowerCase().includes(userTerm) ||
        user.email.toLowerCase().includes(userTerm);

      const blogMatches =
        !blogTerm ||
        user.blogs.some((blog) =>
          [blog.title, blog.category, blog.content]
            .join(' ')
            .toLowerCase()
            .includes(blogTerm)
        );

      return userMatches && blogMatches;
    });
  }

  trackByUserId(_index: number, user: AdminUserActivity): string {
    return user._id;
  }
}
