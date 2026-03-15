import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AdminUserBlogActivity {
  _id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  image: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export interface AdminUserActivity {
  _id: string;
  name: string;
  userName: string;
  email: string;
  totalBlogs: number;
  totalLikes: number;
  totalComments: number;
  blogs: AdminUserBlogActivity[];
}

export interface AdminRelationUser {
  _id: string;
  name: string;
  userName: string;
  email: string;
  avatar?: string;
  followedAt: string;
}

export interface AdminDashboardData {
  summary: {
    totalUsers: number;
    totalBlogs: number;
    totalLikes: number;
    totalComments: number;
  };
  users: AdminUserActivity[];
}

export interface AdminUserDetailsData {
  summary: {
    totalUsers: number;
    totalBlogs: number;
    totalLikes: number;
    totalComments: number;
  };
  user: {
    _id: string;
    name: string;
    userName: string;
    email: string;
    blogs: AdminUserBlogActivity[];
    followers: AdminRelationUser[];
    following: AdminRelationUser[];
    totalFollowers: number;
    totalFollowing: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private blogApiUrl = `${environment.apiUrl}/blog`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<AdminDashboardData>> {
    return this.http.get<ApiResponse<AdminDashboardData>>(`${this.apiUrl}/dashboard`);
  }

  getUserDetails(userId: string): Observable<ApiResponse<AdminUserDetailsData>> {
    return this.http.get<ApiResponse<AdminUserDetailsData>>(`${this.apiUrl}/user/${userId}`);
  }

  deleteBlog(blogId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.blogApiUrl}/${blogId}`);
  }
}
