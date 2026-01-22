import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { LikeResponse } from '../models/like.model';

@Injectable({
  providedIn: 'root'
})
export class LikeService {
  private apiUrl = `${environment.apiUrl}/blog`;

  constructor(private http: HttpClient) {}

  likeBlog(blogId: string): Observable<LikeResponse> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/${blogId}/like`, {});
  }

  unlikeBlog(blogId: string): Observable<LikeResponse> {
    return this.http.delete<LikeResponse>(`${this.apiUrl}/${blogId}/like`);
  }
}
