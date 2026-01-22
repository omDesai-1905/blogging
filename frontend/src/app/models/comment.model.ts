import { User } from './user.model';

export interface Comment {
  _id: string;
  blogId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface CreateCommentRequest {
  content: string;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  data: Comment | Comment[];
}
