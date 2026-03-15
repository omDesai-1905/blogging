import { User } from './user.model';

export interface Blog {
  _id: string;
  userId: string;
  title: string;
  slug: string;
  content: string;
  featureImage: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export interface CreateBlogRequest {
  title: string;
  content: string;
  slug: string;
  category: string;
  featureImage?: File;
}

export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  slug?: string;
  category?: string;
  featureImage?: File;
}

export interface BlogResponse {
  success: boolean;
  message: string;
  data: Blog | Blog[];
}
