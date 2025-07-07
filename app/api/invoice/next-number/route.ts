import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Invoice from '@/models/Invoice';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const prefix = `QUT-`;

    // Find the last invoice and extract its number
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    let sequenceNumber = 1;
    if (lastInvoice && lastInvoice.details.invoiceNumber) {
      const lastNumber = lastInvoice.details.invoiceNumber;
      // Extract the numeric part after the prefix
      const lastSequence = parseInt(lastNumber.replace(prefix, ''));
      if (!isNaN(lastSequence)) {
        sequenceNumber = lastSequence + 1;
      }
    }

    const invoiceNumber = `${prefix}${String(sequenceNumber).padStart(2, '0')}`;

    return NextResponse.json({ invoiceNumber });
  } catch (error: any) {
    console.error('Error generating invoice number:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}