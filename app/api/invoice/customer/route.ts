import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Customer, { ICustomer } from "@/models/Customer";

interface UserInput {
  _id?: string;
  name: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
}

// Validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const user = await   Customer.findOne({ _id: id }).select("-password");
      if (!user) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }
      const userResponse: any = {
        _id: user._id.toString(),
        name: user.name,
        address: user.address,
        state: user.state,
        country: user.country,
        email: user.email,
        phone: user.phone,
      };
      return NextResponse.json(userResponse, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      const customers = await Customer.find().select("-password");
      const userResponses: any = customers.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        address: user.address,
        state: user.state,
        country: user.country,
        email: user.email,
        phone: user.phone,

      }));
      return NextResponse.json(userResponses, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body: UserInput = await req.json();

    const { name, address, state, country, email, phone } = body;

    if (!name || !address || !state || !country || !email || !phone) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missing: { name, address, state, country, email, phone },
        },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }


    const existingEmail = await Customer.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }


    const userDoc = await Customer.create({
      name,
      address,
      state,
      country,
      email,
      phone,
    });

    const userResponse: any = {
      _id: userDoc._id.toString(),
      name: userDoc.name,
      address: userDoc.address,
      state: userDoc.state,
      country: userDoc.country,
      email: userDoc.email,
      phone: userDoc.phone,
    };

    return NextResponse.json(userResponse, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/invoice/user:", error); // Log the error
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: error.stack,
      },
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
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (email && !emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (name && (name.length < 2 || name.length > 100)) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    if (email) {
      const existingEmail = await Customer.findOne({ email, _id: { $ne: _id } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already exists for this name ." },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<ICustomer> = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (state) updateData.state = state;
    if (country) updateData.country = country;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const user = await Customer.findByIdAndUpdate(_id, updateData, {
      new: true,
    }).select("-password");
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(true, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const user = await Customer.findByIdAndDelete(id);
    if (!user) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(true, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
