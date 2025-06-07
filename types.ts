import z from "zod";
import { FieldPath, UseFormReturn } from "react-hook-form";
import { InvoiceSchema, ItemSchema } from "@/lib/schemas";

// Centralized logging function
const log = (message: string, level: 'info' | 'error' | 'debug' = 'info', data?: any) => {
  console[level](`[Types] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Form types
export type InvoiceType = z.infer<typeof InvoiceSchema>;
export type ItemType = z.infer<typeof ItemSchema>;
export type FormType = UseFormReturn<InvoiceType>;
export type NameType = FieldPath<InvoiceType>;
export type CurrencyType = {
    [currencyCode: string]: string;
};

export type CurrencyDetails = {
    currency: string;
    decimals: number;
    beforeDecimal: string | null;
    afterDecimal: string | null;
};

// Signature types
export type SignatureColor = {
    name: string;
    label: string;
    color: string;
};

export type SignatureFont = {
    name: string;
    variable: string;
};

export enum SignatureTabs {
    DRAW = "draw",
    TYPE = "type",
    UPLOAD = "upload",
}

// Wizard types
export type WizardStepType = {
    id: number;
    label: string;
    isValid?: boolean;
};

// Export types
export enum ExportTypes {
    PDF = "pdf",
    JSON = "json",
    CSV = "csv",
    XML = "xml",
    XLSX = "xlsx",
    DOCX = "docx",
}

// Explicit InvoiceType interface
export interface InvoiceTypeExplicit {
    sender: {
        name: string;
        address: string;
        state: string;
        country: string;
        email: string;
        phone: string;
        customInputs?: Array<{ key: string; value: string }>;
    };
    receiver: {
        name: string;
        address: string;
        state: string;
        country: string;
        email: string;
        phone: string;
        customInputs?: Array<{ key: string; value: string }>;
    };
    details: {
        invoiceLogo?: string;
        invoiceNumber: string;
        invoiceDate: string;
        dueDate: string;
        purchaseOrderNumber?: string;
        currency: string;
        language: string;
        items: Array<{
            name: string;
            quantity: number;
            unitPrice: number;
            total: number;
            description?: string;
        }>;
        paymentInformation?: {
            bankName: string;
            accountName: string;
            accountNumber: string;
        };
        taxDetails?: {
            amount: number;
            taxID: string;
            amountType: "amount" | "percentage";
        };
        discountDetails?: {
            amount: number;
            amountType: "amount" | "percentage";
        };
        shippingDetails?: {
            cost: number;
            costType: "amount" | "percentage";
        };
        subTotal: number;
        totalAmount: number;
        totalAmountInWords?: string;
        additionalNotes?: string;
        paymentTerms?: string;
        signature?: {
            data: string;
            fontFamily?: string;
        };
        updatedAt?: string;
        pdfTemplate: number;
        isInvoice: boolean; // Added for invoice/quotation toggle
    };
}