import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectToDatabase } from '@/lib/mongoose';
import User from '@/models/user';

export async function POST(req: NextRequest): Promise<NextResponse> {

  try {
    await connectToDatabase();
    const { username, email, password, role, action, token } = await req.json();

    if (!action) {
      const response = { message: 'Action is required' };
      return NextResponse.json(response, { status: 400 });
    }

    if (action === 'register') {
      if (!username || !email || !password) {
        const response = { message: 'Username, email and password are required' };
        return NextResponse.json(response, { status: 400 });
      }

      try {
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
          const response = { message: 'Username already taken' };
          return NextResponse.json(response, { status: 400 });
        }

        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
          const response = { message: 'Email already taken' };
          return NextResponse.json(response, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        const response = { message: 'User created successfully' };
        return NextResponse.json(response, { status: 201 });
      } catch (error: unknown) {
        const response = {
          message: 'Error creating user',
          error: (error as Error).message,
        };
        return NextResponse.json(response, { status: 500 });
      }
    }

    if (action === 'login') {
      if (!username || !password) {
        const response = { message: 'Username and password are required' };
        return NextResponse.json(response, { status: 400 });
      }

      try {
        const user = await User.findOne({ username });
        if (!user) {
          const response = { message: 'Invalid username or password' };
          return NextResponse.json(response, { status: 400 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          const response = { message: 'Invalid username or password' };
          return NextResponse.json(response, { status: 400 });
        }

        const token = jwt.sign(
          {
            userId: user._id,
            username: user.username,
            role: user.role,
            email: user.email,
          },
          process.env.JWT_SECRET || 'default_secret',
          { expiresIn: '1h' }
        );

        const response = { message: 'Login successful', token };
        return NextResponse.json(response, { status: 200 });
      } catch (error: unknown) {
        const response = {
          message: 'Error during login',
          error: (error as Error).message,
        };
        return NextResponse.json(response, { status: 500 });
      }
    }

    if (action === 'tokenAuth') {
      if (!token) {
        const response = { auth: false, data: 'No token found in request' };
        return NextResponse.json(response, { status: 401 });
      }

      try {
        const decrypt = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        const response = { auth: true, data: decrypt };
        return NextResponse.json(response, { status: 200 });
      } catch (error: unknown) {
        const response = { auth: false, data: 'Invalid or expired token' };
        return NextResponse.json(response, { status: 401 });
      }
    }

    const response = { message: 'Invalid action' };
    return NextResponse.json(response, { status: 400 });
  } catch (error: unknown) {
    const response = {
      message: 'Internal server error',
      error: (error as Error).message,
    };
    return NextResponse.json(response, { status: 500 });
  }
}