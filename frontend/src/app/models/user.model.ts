export interface User {
  _id: string;
  name: string;
  userName: string;
  email: string;

  role?: 'USER' | 'ADMIN';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  avatar?: string;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
  isFollowedByUser?: boolean;
  posts?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FollowRequest {
  _id: string;
  follower: User;
  following: User;
  status: 'pending' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterRequest {
  name: string;
  email: string;
  userName: string;
  password: string;
  gender?: 'male' | 'female' | 'other';
}

export interface LoginRequest {
  userName?: string;
  email?: string;
  emailOrUsername?: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken?: string;
  };
}
