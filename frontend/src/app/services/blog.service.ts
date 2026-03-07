import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Blog, CreateBlogRequest, UpdateBlogRequest, BlogResponse } from '../models/blog.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private apiUrl = `${environment.apiUrl}/blog`;

  constructor(private http: HttpClient) {}

  getAllBlogs(page: number = 1, limit: number = 10): Observable<ApiResponse<Blog[]>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<ApiResponse<Blog[]>>(this.apiUrl, { params });
  }

  getBlog(blogId: string): Observable<ApiResponse<Blog>> {
    return this.http.get<ApiResponse<Blog>>(`${this.apiUrl}/${blogId}`);
  }

  createBlog(data: CreateBlogRequest): Observable<BlogResponse> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('content', data.content);
    formData.append('slug', data.slug);
    formData.append('category', data.category);
    
    if (data.image) {
      formData.append('image', data.image);
    }

    return this.http.post<BlogResponse>(this.apiUrl, formData);
  }

  updateBlog(blogId: string, data: UpdateBlogRequest): Observable<BlogResponse> {
    const formData = new FormData();
    
    if (data.title) {
      formData.append('title', data.title);
    }
    if (data.content) {
      formData.append('content', data.content);
    }
    if (data.slug) {
      formData.append('slug', data.slug);
    }
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.image) {
      formData.append('image', data.image);
    }

    return this.http.post<BlogResponse>(`${this.apiUrl}/${blogId}`, formData);
  }

  deleteBlog(blogId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${blogId}`);
  }
}
