import mongoose, { Schema, Document } from 'mongoose';

// Interface for the Invoice document
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
    email?: string; // Optional as per schema
    phone: string;
  };
  details: {
    invoiceLogo?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date; // Made nvoice
    items: {
      name: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      unitType?: string; // Added from FORM_DEFAULT_VALUES
    }[];
    currency: string;
    language: string;
    taxDetails: {
      amount: number;
      amountType: 'percentage' | 'fixed';
      taxID?: string; // Optional
    };
    discountDetails?: {
      amount: number;
      amountType: 'percentage' | 'fixed' | 'amount';
    };
    shippingDetails?: {
      cost: number;
      costType: 'percentage' | 'fixed' | 'amount';
    };
    paymentInformation: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      IBAN:string;
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

// Mongoose Schema
const InvoiceSchema = new Schema<IInvoice>({
  sender: {
    name: { type: String,  default: 'SPC Source Technical Serivces LLC' },
    address: { type: String,  default: 'Iris Bay, Office D-43, Business Bay, Dubai, UAE.' },
    state: { type: String,  default: 'Dubai' },
    country: { type: String,  default: 'UAE' },
    email: { type: String,  default: 'contact@spcsource.com' },
    phone: { type: String,  default: '+971 54 500 4520' },
  },
  receiver: {
    name: { type: String,  },
    address: { type: String,  },
    state: { type: String,  },
    country: { type: String,  },
    email: { type: String,  }, 
    phone: { type: String,  }
  },
  details: {
    invoiceLogo: { type: String, default: '/public/assets/img/image.jpg' },
    invoiceNumber: { type: String,  },
    invoiceDate: { type: Date,  },
    dueDate: { type: Date,  }, 
    items: [
      {
        name: { type: String,  },
        description: { type: String,  },
        quantity: { type: Number,  },
        unitPrice: { type: Number, },
        total: { type: Number, },
        unitType: { type: String, }, 
      },
    ],
    currency: { type: String,  default: 'AED' },
    language: { type: String,  default: 'English' },
    taxDetails: {
      amount: { type: Number,  default: 0 },
      amountType: { type: String, enum: ['percentage', 'fixed'],  default: 'percentage' },
      taxID: { type: String,  },
    },
    discountDetails: {
      amount: { type: Number, default: 0 },
      amountType: { type: String, enum: ['percentage', 'fixed', 'amount'], default: 'amount' },
    },
    shippingDetails: {
      cost: { type: Number, default: 0 },
      costType: { type: String, enum: ['percentage', 'fixed', 'amount'], default: 'amount' },
    },
    paymentInformation: {
      bankName: { type: String,  default: 'Bank Inc.' },
      accountName: { type: String,  default: 'John Doe' },
      accountNumber: { type: String,  default: '445566998877' },
      IBAN:{type: String,default:' AE450400000883578428001'}
    },
    additionalNotes: { type: String, default: 'Received above items in good condition.' },
    paymentTerms: { type: String,  default: '50% advance , 50% upon delivery or completion.' },
    signature: {
      data: { type: String },
    },
    subTotal: { type: Number,  default: 0 },
    totalAmount: { type: Number,  default: 0 },
    totalAmountInWords: { type: String,  default: '' },
    pdfTemplate: { type: Number,  default: 2 },
    isInvoice: { type: Boolean,  default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

// Export the model
export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);