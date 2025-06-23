// app/api/invoice/auth/token/route.ts
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ auth: false, data: 'No token found in request' }, { status: 401 });
    }

    const decrypt = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    return NextResponse.json({ auth: true, data: decrypt }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/invoice/auth/token:', error);
    return NextResponse.json({ auth: false, data: 'Invalid or expired token' }, { status: 401 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GET method not supported. Use POST for token verification.' }, { status: 405 });
}