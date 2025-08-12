import { connectToDatabase } from "@/lib/mongoose";
import Invoice, { IInvoice } from "@/models/Invoice";
import { NextRequest, NextResponse } from "next/server";

interface InvoiceInput {
  _id?: string;
  invoiceNumber: string;
  sender: {
    name: string;
    address: string;
    state: string;
    country: string;
    email: string;
    phone: string;
  };
  receiver: {
    name: string;
    address: string;
    state: string;
    country: string;
    email: string;
    phone: string;
  };
  details: {
    invoiceLogo?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    items: {
      name: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    currency: string;
    language: string;
    taxDetails: {
      amount: number;
      amountType: 'percentage' | 'fixed';
      taxID: string;
    };
    discountDetails?: {
      amount: number;
      amountType: 'percentage' | 'fixed';
    };
    shippingDetails?: {
      cost: number;
      costType: 'percentage' | 'fixed';
    };
    paymentInformation: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      IBAN:string
    };
    additionalNotes?: string;
    paymentTerms: string;
    signature?: {
      data: string;
    };
    subTotal: number;
    totalAmount: number;
    totalAmountInWords: string;
    pdfTemplate: number;
    isInvoice: boolean;
  };
  createdAt?: Date;
}

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
      const invoice: any = await Invoice.findOne({ _id: id }).select("-password");
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      const invoiceResponse: any = {
        _id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        sender: invoice.sender,
        receiver: invoice.receiver,
        details: {
          invoiceLogo: invoice.details.invoiceLogo,
          invoiceNumber: invoice.details.invoiceNumber,
          invoiceDate: invoice.details.invoiceDate,
          dueDate: invoice.details.dueDate,
          items: invoice.details.items,
          currency: invoice.details.currency,
          language: invoice.details.language,
          taxDetails: invoice.details.taxDetails,
          discountDetails: invoice.details.discountDetails,
          shippingDetails: invoice.details.shippingDetails,
          paymentInformation: invoice.details.paymentInformation,
          additionalNotes: invoice.details.additionalNotes,
          paymentTerms: invoice.details.paymentTerms,
          signature: invoice.details.signature,
          subTotal: invoice.details.subTotal,
          totalAmount: invoice.details.totalAmount,
          totalAmountInWords: invoice.details.totalAmountInWords,
          pdfTemplate: invoice.details.pdfTemplate,
          isInvoice: invoice.details.isInvoice,
        },
        createdAt: invoice.createdAt,
      };
      return NextResponse.json(invoiceResponse, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      const invoices = await Invoice.find().select("-password");
      const invoiceResponses: any = invoices.map((invoice: any) => ({
        _id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        sender: invoice.sender,
        receiver: invoice.receiver,
        details: {
          invoiceLogo: invoice.details.invoiceLogo,
          invoiceNumber: invoice.details.invoiceNumber,
          invoiceDate: invoice.details.invoiceDate,
          dueDate: invoice.details.dueDate,
          items: invoice.details.items,
          currency: invoice.details.currency,
          language: invoice.details.language,
          taxDetails: invoice.details.taxDetails,
          discountDetails: invoice.details.discountDetails,
          shippingDetails: invoice.details.shippingDetails,
          paymentInformation: invoice.details.paymentInformation,
          additionalNotes: invoice.details.additionalNotes,
          paymentTerms: invoice.details.paymentTerms,
          signature: invoice.details.signature,
          subTotal: invoice.details.subTotal,
          totalAmount: invoice.details.totalAmount,
          totalAmountInWords: invoice.details.totalAmountInWords,
          pdfTemplate: invoice.details.pdfTemplate,
          isInvoice: invoice.details.isInvoice,
        },
        createdAt: invoice.createdAt,
      }));
      return NextResponse.json(invoiceResponses, {
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
    const body: InvoiceInput = await req.json();

    // Validate required fields
    if (!body.invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    // Check if invoiceNumber already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber: body.details.invoiceNumber });
    if (existingInvoice) {
      return NextResponse.json(
        { message: "Invoice already exists, no new record created" },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Coerce dates to Date objects if they are strings
    const invoiceDate = typeof body.details.invoiceDate === 'string'
      ? new Date(body.details.invoiceDate)
      : body.details.invoiceDate;
    const dueDate = typeof body.details.dueDate === 'string'
      ? new Date(body.details.dueDate)
      : body.details.dueDate;
    const createdAt = typeof body.createdAt === 'string'
      ? new Date(body.createdAt)
      : body.createdAt || new Date();

    // Create new invoice
    const invoiceDoc = await Invoice.create({
      sender: body.sender,
      receiver: body.receiver,
      details: {
        invoiceLogo: body.details.invoiceLogo,
        invoiceNumber: body.details.invoiceNumber,
        invoiceDate,
        dueDate,
        items: body.details.items,
        currency: body.details.currency,
        language: body.details.language,
        taxDetails: body.details.taxDetails,
        discountDetails: body.details.discountDetails,
        shippingDetails: body.details.shippingDetails,
        paymentInformation: body.details.paymentInformation,
        additionalNotes: body.details.additionalNotes,
        paymentTerms: body.details.paymentTerms,
        signature: body.details.signature,
        subTotal: body.details.subTotal,
        totalAmount: body.details.totalAmount,
        totalAmountInWords: body.details.totalAmountInWords,
        pdfTemplate: body.details.pdfTemplate,
        isInvoice: body.details.isInvoice,
      },
      createdAt,
    });
    const invoiceResponse: any = {
      _id: invoiceDoc._id.toString(),
      invoiceNumber: invoiceDoc.details.invoiceNumber,
      sender: invoiceDoc.sender,
      receiver: invoiceDoc.receiver,
      details: {
        invoiceLogo: invoiceDoc.details.invoiceLogo,
        invoiceNumber: invoiceDoc.details.invoiceNumber,
        invoiceDate: invoiceDoc.details.invoiceDate,
        dueDate: invoiceDoc.details.dueDate,
        items: invoiceDoc.details.items,
        currency: invoiceDoc.details.currency,
        language: invoiceDoc.details.language,
        taxDetails: invoiceDoc.details.taxDetails,
        discountDetails: invoiceDoc.details.discountDetails,
        shippingDetails: invoiceDoc.details.shippingDetails,
        paymentInformation: invoiceDoc.details.paymentInformation,
        additionalNotes: invoiceDoc.details.additionalNotes,
        paymentTerms: invoiceDoc.details.paymentTerms,
        signature: invoiceDoc.details.signature,
        subTotal: invoiceDoc.details.subTotal,
        totalAmount: invoiceDoc.details.totalAmount,
        totalAmountInWords: invoiceDoc.details.totalAmountInWords,
        pdfTemplate: invoiceDoc.details.pdfTemplate,
        isInvoice: invoiceDoc.details.isInvoice,
      },
      createdAt: invoiceDoc.createdAt,
    };

    return NextResponse.json(invoiceResponse, {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("Error in POST /api/invoice/new_invoice:", error);
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
    const body: InvoiceInput = await req.json();

    const { invoiceNumber, sender, receiver, details, _id } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const updateData: Partial<IInvoice> = {};
    if (invoiceNumber) updateData.invoiceNumber = invoiceNumber;
    if (sender) updateData.sender = sender;
    if (receiver) updateData.receiver = receiver;
    if (details) {
      updateData.details = {
        invoiceLogo: details.invoiceLogo,
        invoiceNumber: details.invoiceNumber,
        invoiceDate: details.invoiceDate,
        dueDate: details.dueDate,
        items: details.items,
        currency: details.currency,
        language: details.language,
        taxDetails: details.taxDetails,
        discountDetails: details.discountDetails,
        shippingDetails: details.shippingDetails,
        paymentInformation: details.paymentInformation,
        additionalNotes: details.additionalNotes,
        paymentTerms: details.paymentTerms,
        signature: details.signature,
        subTotal: details.subTotal,
        totalAmount: details.totalAmount,
        totalAmountInWords: details.totalAmountInWords,
        pdfTemplate: details.pdfTemplate,
        isInvoice: details.isInvoice,
      };
    }

    const invoice = await Invoice.findByIdAndUpdate(_id, updateData, {
      new: true,
    }).select("-password");
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
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