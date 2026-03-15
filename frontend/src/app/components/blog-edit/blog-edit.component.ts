import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { Blog } from '../../models/blog.model';

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './blog-edit.component.html',
  styleUrls: ['./blog-edit.component.css']
})
export class BlogEditComponent implements OnInit {
  blogForm!: FormGroup;
  errorMessage = '';
  isLoading = false;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentBlog: Blog | null = null;
  blogId: string = '';

  constructor(
    private fb: FormBuilder,
    private blogService: BlogService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.blogForm = this.fb.group({
      title: ['', [Validators.required]],
      slug: ['', [Validators.required]],
      category: ['', [Validators.required]],
      content: ['', [Validators.required]]
    });

    this.blogId = this.route.snapshot.paramMap.get('id') || '';
    if (this.blogId) {
      this.loadBlog();
    } else {
      this.errorMessage = 'Blog ID not found';
    }
  }

  loadBlog(): void {
    this.isLoading = true;
    this.blogService.getBlog(this.blogId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentBlog = response.data as Blog;
          this.blogForm.patchValue({
            title: this.currentBlog.title,
            slug: this.currentBlog.slug,
            category: this.currentBlog.category,
            content: this.currentBlog.content
          });
          this.imagePreview = this.currentBlog.featureImage;
        } else {
          this.errorMessage = 'Failed to load blog';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load blog';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  generateSlug(): void {
    const title = this.blogForm.get('title')?.value;
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      this.blogForm.patchValue({ slug });
    }
  }

  onSubmit(): void {
    if (this.blogForm.invalid) {
      this.markFormGroupTouched(this.blogForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const blogData: any = {
      title: this.blogForm.value.title,
      slug: this.blogForm.value.slug,
      category: this.blogForm.value.category,
      content: this.blogForm.value.content
    };

    if (this.selectedFile) {
      blogData.featureImage = this.selectedFile;
    }

    this.blogService.updateBlog(this.blogId, blogData).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/blog', this.blogId]);
        } else {
          this.errorMessage = response.message || 'Failed to update blog';
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred while updating the blog';
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
