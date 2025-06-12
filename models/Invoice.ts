import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
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
      amountType: 'percentage' | 'fixed' | 'amount'; // Add 'amount' to enum
    };
    shippingDetails?: {
      cost: number;
      costType: 'percentage' | 'fixed' | 'amount'; // Add 'amount' to enum
    };
    paymentInformation: {
      bankName: string;
      accountName: string;
      accountNumber: string;
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

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true },
  sender: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  receiver: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  details: {
    invoiceLogo: { type: String },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    currency: { type: String, required: true },
    language: { type: String, required: true },
    taxDetails: {
      amount: { type: Number, required: true },
      amountType: { type: String, enum: ['percentage', 'fixed'], required: true },
      taxID: { type: String, required: false }, // Make optional
    },
    discountDetails: {
      amount: { type: Number },
      amountType: { type: String, enum: ['percentage', 'fixed', 'amount'] }, // Add 'amount'
    },
    shippingDetails: {
      cost: { type: Number },
      costType: { type: String, enum: ['percentage', 'fixed', 'amount'] }, // Add 'amount'
    },
    paymentInformation: {
      bankName: { type: String, required: true },
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
    },
    additionalNotes: { type: String },
    paymentTerms: { type: String, required: true },
    signature: {
      data: { type: String },
    },
    subTotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    totalAmountInWords: { type: String, required: true },
    pdfTemplate: { type: Number, required: true },
    isInvoice: { type: Boolean, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);