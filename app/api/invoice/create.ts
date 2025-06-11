// pages/api/invoice/create.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import  Invoice  from '@/models/Invoice';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { sender, receiver, details } = body;

    // Validate required fields
    if (!sender || !receiver || !details) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: { sender, receiver, details } },
        { status: 400 }
      );
    }

    // Generate invoice number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // e.g., "25" for 2025
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // e.g., "05" for May
    const invoiceCount = await Invoice.countDocuments({
      invoiceNumber: { $regex: `^INV${year}${month}`, $options: 'i' },
    });
    const invoiceNumber = `INV${year}${month}${String(invoiceCount + 1).padStart(2, '0')}`;

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      sender,
      receiver,
      details: {
        ...details,
        invoiceNumber, 
        invoiceDate: new Date(details.invoiceDate),
        dueDate: new Date(details.dueDate),
      },
    });

    return NextResponse.json(
      {
        invoiceNumber: invoice.invoiceNumber,
        sender: invoice.sender,
        receiver: invoice.receiver,
        details: invoice.details,
        createdAt: invoice.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}