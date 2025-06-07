import  User  from '@/models/user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json();
    const response = await User.create(data);
    return NextResponse.json({ message: 'Successfully created User', response }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create User', error }, { status: 400 });
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const data = await req.json();
    const { id } = Object.fromEntries(new URL(req.url).searchParams);
    const response = await User.findByIdAndUpdate(id, data, { new: true });
    return NextResponse.json({ message: 'Successfully updated User', response }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update User', error }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);
    const response = await User.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Successfully deleted User', response }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to delete User', error }, { status: 400 });
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { id } = Object.fromEntries(new URL(req.url).searchParams);
    if (id) {
      const response = await User.findById(id);
      return NextResponse.json({ message: 'Successfully retrieved User', response }, { status: 200 });
    }
    const response = await User.find();
    return NextResponse.json({ message: 'Successfully retrieved Users', response }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to retrieve Users', error }, { status: 400 });
  }
}