import { User } from './user.model';

export interface Blog {
  _id: string;
  userId: string;
  userEmail: string;
  title: string;
  slug: string;
  content: string;
  image: string;
  category: string;
  visit: number;
  topicId?: string;
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
  image?: File;
}

export interface UpdateBlogRequest {
  title?: string;
  content?: string;
  slug?: string;
  category?: string;
  image?: File;
}

export interface BlogResponse {
  success: boolean;
  message: string;
  data: Blog | Blog[];
}
