export interface Like {
  _id: string;
  blogId: string;
  userId: string;
  createdAt: Date;
}

export interface LikeResponse {
  success: boolean;
  message: string;
  data?: Like;
}
