import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/user";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {

  try {
    await connectToDatabase();

    const { username, email, password, role } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Username, email, and password are required' }, { status: 400 });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    if(password.trim().length < 8){
      return NextResponse.json({ error: 'Password Must be 8 cheracters Long.' }, { status: 400 });

    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    return NextResponse.json({ message: 'User registered successfully', user: newUser._id }, { status: 201 });
  } catch (err:any) {
    console.error('Error in /api/invoice/auth/register:', err);
    return  NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return  NextResponse.json({ error: 'GET method not supported. Use POST for registration.' }, { status: 405 });
}