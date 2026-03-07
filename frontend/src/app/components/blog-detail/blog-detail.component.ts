import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { CommentService } from '../../services/comment.service';
import { LikeService } from '../../services/like.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Blog } from '../../models/blog.model';
import { Comment } from '../../models/comment.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.css']
})
export class BlogDetailComponent implements OnInit {
  blog: Blog | null = null;
  comments: Comment[] = [];
  isLoading = false;
  errorMessage = '';
  commentText = '';
  isSubmittingComment = false;
  isAuthenticated = false;
  currentUserId = '';
  isTogglingLike = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private commentService: CommentService,
    private likeService: LikeService,
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.currentUserId = this.authService.currentUserValue?._id || '';
    
    const blogId = this.route.snapshot.paramMap.get('id');
    if (blogId) {
      this.loadBlog(blogId);
      this.loadComments(blogId);
    }
  }

  loadBlog(blogId: string, resetTogglingFlag: boolean = false): void {
    const wasTogglingLike = this.isTogglingLike;
    if (!wasTogglingLike) {
      this.isLoading = true;
    }
    this.blogService.getBlog(blogId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.blog = response.data as Blog;
        }
        if (!wasTogglingLike) {
          this.isLoading = false;
        }
        if (resetTogglingFlag) {
          this.isTogglingLike = false;
        }
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load blog';
        if (!wasTogglingLike) {
          this.isLoading = false;
        }
        if (resetTogglingFlag) {
          this.isTogglingLike = false;
        }
      }
    });
  }

  loadComments(blogId: string): void {
    this.commentService.getComments(blogId).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.comments = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load comments', error);
      }
    });
  }

  toggleLike(): void {
    if (!this.isAuthenticated || !this.blog || this.isTogglingLike) {
      if (!this.isAuthenticated) {
        this.router.navigate(['/login']);
      }
      return;
    }

    this.isTogglingLike = true;
    const wasLiked = this.blog.isLiked;
    const blogId = this.blog._id;

    if (wasLiked) {
      this.likeService.unlikeBlog(blogId).subscribe({
        next: (response) => {
          if (response.success) {
            // Reload blog to get accurate state, then reset flag
            this.loadBlog(blogId, true);
          } else {
            this.isTogglingLike = false;
          }
        },
        error: (error) => {
          console.error('Failed to unlike:', error);
          alert('Failed to unlike post: ' + (error.error?.message || 'Unknown error'));
          this.isTogglingLike = false;
        }
      });
    } else {
      this.likeService.likeBlog(blogId).subscribe({
        next: (response) => {
          if (response.success) {
            // Reload blog to get accurate state, then reset flag
            this.loadBlog(blogId, true);
          } else {
            this.isTogglingLike = false;
          }
        },
        error: (error) => {
          console.error('Failed to like:', error);
          alert('Failed to like post: ' + (error.error?.message || 'Unknown error'));
          this.isTogglingLike = false;
        }
      });
    }
  }

  submitComment(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.commentText.trim() || !this.blog) return;

    this.isSubmittingComment = true;
    this.commentService.createComment(this.blog._id, { content: this.commentText }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.comments.unshift(response.data as Comment);
          this.commentText = '';
        }
        this.isSubmittingComment = false;
      },
      error: (error) => {
        console.error('Failed to post comment', error);
        this.isSubmittingComment = false;
      }
    });
  }

  deleteBlog(): void {
    if (!this.blog || !confirm('Are you sure you want to delete this blog?')) return;

    this.blogService.deleteBlog(this.blog._id).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        alert('Failed to delete blog: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  editBlog(): void {
    if (!this.blog) return;
    this.router.navigate(['/blog/edit', this.blog._id]);
  }

  canEditBlog(): boolean {
    return this.blog?.userId === this.currentUserId;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
