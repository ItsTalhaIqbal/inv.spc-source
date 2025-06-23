import { z } from "zod";

// Helpers
import { formatNumberWithCommas } from "@/lib/helpers";

// Variables
import { DATE_OPTIONS } from "@/lib/variables";

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
  email: z
    .string()
    .optional(),
  phone: z
    .string()
    .min(1, { message: "Must be between 1 and 50 characters" })
    .max(50, {
      message: "Must be between 1 and 50 characters",
    }),
  date: z
    .string()
    .transform((val) =>
      new Date(val).toLocaleDateString("en-US", DATE_OPTIONS)
    ),
  quantity: z
    .union([z.coerce.number(), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val == null ? undefined : Number(val))),
  unitPrice: z
    .union([z.coerce.number(), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val == null ? undefined : Number(val))),
  string: z.string(),
  stringMin1: z.string().min(1, { message: "Must be at least 1 character" }),
  stringToNumber: z.coerce.number(),
  stringToNumberWithMax: z.coerce.number().max(1000000),
  stringOptional: z.string().optional(),
  nonNegativeNumber: z.coerce.number().nonnegative({
    message: "Total amount cannot be negative.",
  }),
  numWithCommas: z.coerce
    .number()
    .nonnegative({
      message: "Total amount cannot be negative.",
    })
    .transform((value) => {
      return formatNumberWithCommas(value);
    }),
};

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
  unitType: z.string(),
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
  costType: fieldValidators.string,
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
  subTotal: fieldValidators.nonNegativeNumber,
  totalAmount: fieldValidators.nonNegativeNumber, // Ensures totalAmount is >= 0
  totalAmountInWords: fieldValidators.string,
  additionalNotes: fieldValidators.stringOptional,
  paymentTerms: fieldValidators.stringMin1,
  signature: SignatureSchema.optional(),
  updatedAt: fieldValidators.stringOptional,
  pdfTemplate: z.number(),
  isInvoice: z.boolean().default(false),
});

const InvoiceSchema = z.object({
  sender: InvoiceSenderSchema,
  receiver: InvoiceReceiverSchema,
  details: InvoiceDetailsSchema,
});

export { InvoiceSchema, ItemSchema };