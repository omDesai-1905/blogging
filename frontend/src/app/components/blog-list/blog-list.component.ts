import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BlogService } from '../../services/blog.service';
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

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
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
}
