import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // Changed to bcryptjs
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/user";

export async function POST(req: Request): Promise<NextResponse> {
  console.log('POST /api/invoice/auth/login');

  try {
    await connectToDatabase();
    console.log('MongoDB connected');

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 400 });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1h" }
    );

    return NextResponse.json({ message: 'Login successful', token }, { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/invoice/auth/login:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  console.log('Unexpected GET request to /api/invoice/auth/login from:', req.headers.get('user-agent'));
  return NextResponse.json({ error: 'GET method not supported. Use POST for login.' }, { status: 405 });
}