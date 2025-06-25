import { z } from "zod";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

// Define TypeScript types for better type safety
export type NameType = `details.${keyof InvoiceDetailsSchemaType}` | `sender.${keyof InvoiceSenderSchemaType}` | `receiver.${keyof InvoiceReceiverSchemaType}`;

// Field Validators
const fieldValidators = {
  name: z.string().optional(),
  address: z
    .string()
    .min(2, { message: "Must be at least 2 characters" })
    .max(70, { message: "Must be between 2 and 70 characters" }),
  state: z
    .string()
    .min(1, { message: "Must be between 1 and 50 characters" })
    .max(50, { message: "Must be between 1 and 50 characters" }),
  country: z
    .string()
    .min(1, { message: "Must be between 1 and 70 characters" })
    .max(70, { message: "Must be between 1 and 70 characters" }),
  email: z.string().optional(),
  phone: z
    .string()
    .min(1, { message: "Must be between 1 and 50 characters" })
    .max(50, { message: "Must be between 1 and 50 characters" }),
  date: z
    .string()
    .refine((val) => val === "" || !isNaN(Date.parse(val)), { message: "Must be a valid date string" })
    .transform((val) => (val === "" ? undefined : new Date(val).toLocaleDateString("en-US", DATE_OPTIONS))),
  quantity: z
    .union([z.coerce.number(), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val == null ? undefined : Number(val))),
  unitPrice: z
    .union([z.coerce.number(), z.literal("")])
    .transform((val) => (val === "" || val == null ? undefined : Number(val))),
  string: z.string(),
  stringMin1: z.string().min(1, { message: "Required field." }),
  stringToNumber: z.coerce.number(),
  stringToNumberWithMax: z.coerce.number().max(1000000),
  stringOptional: z.string().optional(),
  nonNegativeNumber: z.coerce.number().positive({
    message: "Total amount must be greater than zero.",
  }),
  numWithCommas: z.coerce
    .number()
    .nonnegative({
      message: "Total amount cannot be negative.",
    })
    .transform((value) => formatNumberWithCommas(value)),
};

// Schemas
const CustomInputSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const InvoiceSenderSchema = z.object({
  name: fieldValidators.name,
  address: fieldValidators.address,
  state: fieldValidators.state,
  country: fieldValidators.country,
  email: fieldValidators.email,
  phone: fieldValidators.phone,
  customInputs: z.array(CustomInputSchema).optional(),
});

const InvoiceReceiverSchema = z.object({
  name: fieldValidators.name,
  address: fieldValidators.address,
  state: fieldValidators.state,
  country: fieldValidators.country,
  email: fieldValidators.email,
  phone: fieldValidators.phone,
  customInputs: z.array(CustomInputSchema).optional(),
});

const ItemSchema = z.object({
  name: fieldValidators.stringMin1,
  description: fieldValidators.stringOptional,
  quantity: fieldValidators.quantity,
  unitPrice: fieldValidators.unitPrice,
  total: fieldValidators.stringToNumber,
  unitType: fieldValidators.stringMin1, // Changed to require non-empty string
});

const PaymentInformationSchema = z.object({
  bankName: fieldValidators.stringMin1,
  accountName: fieldValidators.stringMin1,
  accountNumber: fieldValidators.stringMin1,
});

const DiscountDetailsSchema = z.object({
  amount: fieldValidators.stringToNumberWithMax,
  amountType: fieldValidators.string,
});

const TaxDetailsSchema = z.object({
  amount: fieldValidators.stringToNumberWithMax,
  taxID: fieldValidators.string,
  amountType: fieldValidators.string,
});

const ShippingDetailsSchema = z.object({
  cost: fieldValidators.stringToNumberWithMax,
  costType: z.string(),
});

const SignatureSchema = z.object({
  data: fieldValidators.string,
  fontFamily: fieldValidators.string.optional(),
});

const InvoiceDetailsSchema = z.object({
  invoiceLogo: fieldValidators.stringOptional,
  invoiceNumber: fieldValidators.stringMin1,
  invoiceDate: fieldValidators.date,
  dueDate: fieldValidators.date.optional(),
  purchaseOrderNumber: fieldValidators.stringOptional,
  currency: fieldValidators.string,
  language: fieldValidators.string,
  items: z.array(ItemSchema),
  paymentInformation: PaymentInformationSchema.optional(),
  taxDetails: TaxDetailsSchema.optional(),
  discountDetails: DiscountDetailsSchema.optional(),
  shippingDetails: ShippingDetailsSchema.optional(),
  subTotal: fieldValidators.stringToNumber,
  totalAmount: fieldValidators.nonNegativeNumber,
  totalAmountInWords: fieldValidators.string,
  additionalNotes: fieldValidators.stringOptional,
  paymentTerms: fieldValidators.stringMin1,
  signature: SignatureSchema.optional(),
  updatedAt: fieldValidators.stringOptional,
  pdfTemplate: z.number(),
  isInvoice: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.dueDate) {
      const due = new Date(data.dueDate);
      const invoice = new Date(data.invoiceDate as any);
      if (isNaN(due.getTime()) || isNaN(invoice.getTime())) {
        return false; // Invalid dates
      }
      invoice.setHours(0, 0, 0, 0); // Normalize to start of day
      due.setHours(0, 0, 0, 0); // Normalize to start of day
      return due >= invoice;
    }
    return true; // Pass if dueDate is not provided
  },
  {
    message: "Due date can't before the invoice date.",
    path: ["dueDate"],
  }
);

const InvoiceSchema = z.object({
  sender: InvoiceSenderSchema,
  receiver: InvoiceReceiverSchema,
  details: InvoiceDetailsSchema,
});

// Export TypeScript types inferred from Zod schemas
export type InvoiceSchemaType = z.infer<typeof InvoiceSchema>;
export type ItemSchemaType = z.infer<typeof ItemSchema>;
export type InvoiceDetailsSchemaType = z.infer<typeof InvoiceDetailsSchema>;
export type InvoiceSenderSchemaType = z.infer<typeof InvoiceSenderSchema>;
export type InvoiceReceiverSchemaType = z.infer<typeof InvoiceReceiverSchema>;
export type CustomInputSchemaType = z.infer<typeof CustomInputSchema>;
export type PaymentInformationSchemaType = z.infer<typeof PaymentInformationSchema>;
export type DiscountDetailsSchemaType = z.infer<typeof DiscountDetailsSchema>;
export type TaxDetailsSchemaType = z.infer<typeof TaxDetailsSchema>;
export type ShippingDetailsSchemaType = z.infer<typeof ShippingDetailsSchema>;
export type SignatureSchemaType = z.infer<typeof SignatureSchema>;

// Export schemas
export { InvoiceSchema, ItemSchema };