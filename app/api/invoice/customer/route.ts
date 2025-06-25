import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Customer, { ICustomer } from '@/models/Customer';

interface UserInput {
  _id?: string;
  name: string;
  address: string;
  state: string;
  country: string;
  email?: string;
  phone: string;
}

// Validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body: UserInput = await req.json();

    const { name, address, state, country, email, phone } = body;

    if (!name.trim() || !address.trim() || !state.trim() || !country.trim() || !phone.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: { name, address, state, country, phone } },
        { status: 400 }
      );
    }

    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (email && email.trim()) {
      const existingEmail = await Customer.findOne({ email });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      }
    }

    const createData: Partial<ICustomer> = {
      name: name.trim(),
      address: address.trim(),
      state: state.trim(),
      country: country.trim(),
      phone: phone.trim(),
    };

    if (email && email.trim()) {
      createData.email = email.trim();
    }

    const userDoc = await Customer.create(createData);

    const userResponse: any = {
      _id: userDoc._id.toString(),
      name: userDoc.name,
      address: userDoc.address,
      state: userDoc.state,
      country: userDoc.country,
      email: userDoc.email || "",
      phone: userDoc.phone,
    };

    return NextResponse.json(userResponse, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error in POST /api/invoice/customer:', {
      message: error.message,
      stack: error.stack,
      errorDetails: error.errors ? JSON.stringify(error.errors) : null,
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const user = await Customer.findOne({ _id: id }).select('-password');
      if (!user) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      const userResponse: any = {
        _id: user._id.toString(),
        name: user.name,
        address: user.address,
        state: user.state,
        country: user.country,
        email: user.email || "",
        phone: user.phone,
      };
      return NextResponse.json(userResponse, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    } else {
      const customers = await Customer.find().select('-password');
      const userResponses: any = customers.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        address: user.address,
        state: user.state,
        country: user.country,
        email: user.email || "",
        phone: user.phone,
      }));
      return NextResponse.json(userResponses, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
  } catch (error: any) {
    console.error('Error in GET /api/invoice/customer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const body: UserInput = await req.json();

    const { name, address, state, country, email, phone, _id } = body;

    if (!_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    if (!name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!address.trim()) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    if (!phone.trim()) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 });
    }

    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (email && email.trim()) {
      const existingEmail = await Customer.findOne({
        email,
        _id: { $ne: _id },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already exists for another customer' },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<ICustomer> = {
      name: name.trim(),
      address: address.trim(),
      state: state.trim(),
      country: country.trim(),
      phone: phone.trim(),
    };

    // Use $set for fields to update and $unset for email if null or undefined
    const updateQuery: any = { $set: updateData };
    if (email === null || email === undefined) {
      updateQuery.$unset = { email: "" };
    } else if (email && email.trim()) {
      updateData.email = email.trim();
    }

    const user = await Customer.findByIdAndUpdate(_id, updateQuery, {
      new: true,
    }).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const userResponse: any = {
      _id: user._id.toString(),
      name: user.name,
      address: user.address,
      state: user.state,
      country: user.country,
      email: user.email || "",
      phone: user.phone,
    };

    return NextResponse.json(userResponse, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error in PUT /api/invoice/customer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const user = await Customer.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(true, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/invoice/customer:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}