import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { LikeService } from '../../services/like.service';
import { AuthService } from '../../services/auth.service';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.css']
})
export class BlogListComponent implements OnInit {
  blogs: Blog[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  totalPages = 1;
  isAuthenticated = false;
  togglingLikeForBlog: string | null = null;

  constructor(
    private blogService: BlogService,
    private likeService: LikeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.loadBlogs();
  }

  loadBlogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getAllBlogs(this.currentPage).subscribe({
      next: (response) => {
        if (response.success && Array.isArray(response.data)) {
          this.blogs = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load blogs';
        this.isLoading = false;
      }
    });
  }

  getExcerpt(content: string, length: number = 150): string {
    if (content.length <= length) return content;
    return content.substring(0, length) + '...';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  toggleLike(blog: Blog, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.togglingLikeForBlog === blog._id) {
      return;
    }

    this.togglingLikeForBlog = blog._id;
    const wasLiked = blog.isLiked;

    if (wasLiked) {
      this.likeService.unlikeBlog(blog._id).subscribe({
        next: (response) => {
          if (response.success) {
            blog.isLiked = false;
            blog.likesCount = Math.max(0, (blog.likesCount || 0) - 1);
          }
          this.togglingLikeForBlog = null;
        },
        error: (error) => {
          console.error('Failed to unlike:', error);
          this.togglingLikeForBlog = null;
        }
      });
    } else {
      this.likeService.likeBlog(blog._id).subscribe({
        next: (response) => {
          if (response.success) {
            blog.isLiked = true;
            blog.likesCount = (blog.likesCount || 0) + 1;
          }
          this.togglingLikeForBlog = null;
        },
        error: (error) => {
          console.error('Failed to like:', error);
          this.togglingLikeForBlog = null;
        }
      });
    }
  }

  isTogglingLike(blogId: string): boolean {
    return this.togglingLikeForBlog === blogId;
  }
}
