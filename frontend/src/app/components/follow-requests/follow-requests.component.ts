import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { FollowRequest } from '../../models/user.model';

@Component({
  selector: 'app-follow-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './follow-requests.component.html',
  styleUrl: './follow-requests.component.css'
})
export class FollowRequestsComponent implements OnInit {
  pendingRequests: FollowRequest[] = [];
  sentRequests: FollowRequest[] = [];
  activeTab: 'received' | 'sent' = 'received';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';
    
    if (this.activeTab === 'received') {
      this.userService.getPendingFollowRequests().subscribe({
        next: (response) => {
          this.pendingRequests = response.data || [];
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to load follow requests';
          this.loading = false;
        }
      });
    } else {
      this.userService.getMySentFollowRequests().subscribe({
        next: (response) => {
          this.sentRequests = response.data || [];
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to load sent requests';
          this.loading = false;
        }
      });
    }
  }

  switchTab(tab: 'received' | 'sent'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
    this.loadRequests();
  }

  acceptRequest(requestId: string): void {
    this.userService.acceptFollowRequest(requestId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.pendingRequests = this.pendingRequests.filter(req => req._id !== requestId);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to accept request';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  rejectRequest(requestId: string): void {
    this.userService.rejectFollowRequest(requestId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.pendingRequests = this.pendingRequests.filter(req => req._id !== requestId);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to reject request';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  cancelRequest(userId: string, requestId: string): void {
    this.userService.cancelFollowRequest(userId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.sentRequests = this.sentRequests.filter(req => req._id !== requestId);
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to cancel request';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }
}
