import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { User, FollowRequest } from '../models/user.model';
import { Blog } from '../models/blog.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getUserProfile(userName: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${userName}`);
  }

  getUserPosts(userName: string): Observable<ApiResponse<Blog[]>> {
    return this.http.get<ApiResponse<Blog[]>>(`${this.apiUrl}/${userName}/posts`);
  }

  followUser(userId: string): Observable<ApiResponse<{ status: string }>> {
    return this.http.post<ApiResponse<{ status: string }>>(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollowUser(userId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${userId}/unfollow`);
  }

  getMyPosts(): Observable<ApiResponse<Blog[]>> {
    return this.http.get<ApiResponse<Blog[]>>(`${this.apiUrl}/my/posts`);
  }

  getLikesOnMyPosts(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my/posts/likes`);
  }

  getCommentsOnMyPosts(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my/posts/comments`);
  }

  getMyFollowers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my/followers`);
  }

  getMyFollowing(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/my/following`);
  }

  searchUsers(query: string): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
  }
}
