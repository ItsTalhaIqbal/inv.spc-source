// lib/serverAuth.ts
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface UserData {
  username: string;
  email: string;
  userId: string;
  role?: string;
}

export const getServerAuth = async (): Promise<UserData | null> => {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    // Verify token directly without API call
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as UserData;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};