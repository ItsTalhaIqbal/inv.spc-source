// Types
import { SignatureColor, SignatureFont } from "@/types";

/**
 * Environment
 */
export const ENV = process.env.NODE_ENV;

/**
 * Websites
 */
export const BASE_URL = "https://invoify.vercel.app";
export const AUTHOR_WEBSITE = "https://aliabb.vercel.app";
export const AUTHOR_GITHUB = "https://github.com/al1abb";

/**
 * API endpoints
 */
export const GENERATE_PDF_API = "/api/invoice/generate";
export const SEND_PDF_API = "/api/invoice/send";
export const EXPORT_INVOICE_API = "/api/invoice/export";

/**
 * External API endpoints
 */
export const CURRENCIES_API =
    "https://openexchangerates.org/api/currencies.json";

/**
 * Chromium for Puppeteer
 */
export const CHROMIUM_EXECUTABLE_PATH =
    "https://github.com/Sparticuz/chromium/releases/download/v122.0.0/chromium-v122.0.0-pack.tar";

/**
 * Tailwind
 */
export const TAILWIND_CDN =
    "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";

/**
 * Google
 */
export const GOOGLE_SC_VERIFICATION = process.env.GOOGLE_SC_VERIFICATION;

/**
 * Nodemailer
 */
export const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
export const NODEMAILER_PW = process.env.NODEMAILER_PW;

/**
 * I18N
 */
export const LOCALES = [
    { code: "en", name: "English" },
    { code: "de", name: "Deutsch" },
    { code: "it", name: "Italiano" },
    { code: "es", name: "Español" },
    { code: "ca", name: "Català" },
    { code: "fr", name: "Français" },
    { code: "ar", name: "العربية" },
    { code: "pl", name: "Polish" },
    { code: "pt-BR", name: "Português (Brasil)" },
    { code: "tr", name: "Türkçe" },
    { code: "ja", name: "日本語" },
    { code: "nb-NO", name: "Norwegian (bokmål)" },
    { code: "nn-NO", name: "Norwegian (nynorsk)" },
];
export const DEFAULT_LOCALE = LOCALES[0].code;

/**
 * Signature variables
 */
export const SIGNATURE_COLORS: SignatureColor[] = [
    { name: "black", label: "Black", color: "rgb(0, 0, 0)" },
    { name: "dark blue", label: "Dark Blue", color: "rgb(0, 0, 128)" },
    { name: "crimson", label: "Crimson", color: "#DC143C" },
];

// Global PDF Type Variables
export const INVVariable: string = "INV-";
export const QUTVariable: string = "QUT-";

// Unit Types
export const UNIT_TYPES = ["pcs", "sqm", "roll"];

/**
 * Signature fonts
 */
export const SIGNATURE_FONTS: SignatureFont[] = [
    { name: "Dancing Script", variable: "var(--font-dancing-script)" },
    { name: "Parisienne", variable: "var(--font-parisienne)" },
    { name: "Great Vibes", variable: "var(--font-great-vibes)" },
    { name: "Alex Brush", variable: "var(--font-alex-brush)" },
];

/**
 * Form date options
 */
export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
};

export const SHORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
};

/**
 * Form defaults
 */
export const FORM_DEFAULT_VALUES = {
    sender: {
        name: "SPC Source Technical Serivces LLC",
        country: "UAE",
        state: "Dubai",
        email: "contact@spcsource.com",
        address: "Iris Bay, Office D-43, Business Bay, Dubai, UAE.",
        phone: "+971 54 500 4520",
    },
    receiver: {
        name: "",
        address: "",
        state: "",
        country: "",
        email: "",
        phone: "",
    },
    details: {
        pdfTemplate: 2,
        invoiceLogo: "/public/assets/img/image.jpg",
        invoiceNumber: "",
        invoiceDate: "",
        dueDate: "",
        items: [
            {
                name: "",
                quantity: 0,
                unitPrice: 0,
                total: 0,
                unitType: "", 
            },
        ],
        currency: "AED",
        language: "English",
        taxDetails: {
            amount: 0,
            amountType: "percentage",
            taxID: "",
        },
        discountDetails: {
            amount: 0,
            amountType: "amount",
        },
        shippingDetails: {
            cost: 0,
            costType: "amount",
        },
        paymentInformation: {
            bankName: "Bank Inc.",
            accountName: "John Doe",
            accountNumber: "445566998877",
        },
        additionalNotes: "Received above items in good condition.",
        paymentTerms: "50% advance upon confirmation of the order, 50% upon delivery or completion.",
        totalAmountInWords: "",
        isInvoice: false,
    },
};

/**
 * ? DEV Only
 * Form auto fill values for testing
 */
export const FORM_FILL_VALUES = {
    sender: {
        name: "John Doe",
        address: "123 Main St",
        state: "Anytown",
        country: "USA",
        email: "johndoe@example.com",
        phone: "123-456-7890",
    },
    receiver: {
        name: "Jane Smith",
        address: "456 Elm St",
        state: "Other Town",
        country: "Canada",
        email: "janesmith@example.com",
        phone: "987-654-3210",
    },
    details: {
        invoiceLogo: "",
        invoiceNumber: "INV0001",
        invoiceDate: new Date(),
        dueDate: new Date(),
        items: [
            {
                name: "Product 1",
                description: "Description of Product 1",
                quantity: 4,
                unitPrice: 50,
                total: 200,
                unitType: "pcs", // Added unitType
            },
            {
                name: "Product 2",
                description: "Description of Product 2",
                quantity: 5,
                unitPrice: 50,
                total: 250,
                unitType: "sqm", // Added unitType
            },
            {
                name: "Product 3",
                description: "Description of Product 3",
                quantity: 5,
                unitPrice: 80,
                total: 400,
                unitType: "roll", // Added unitType
            },
        ],
        currency: "USD",
        language: "English",
        taxDetails: {
            amount: 15,
            amountType: "percentage",
            taxID: "987654321",
        },
        discountDetails: {
            amount: 5,
            amountType: "percentage",
        },
        shippingDetails: {
            cost: 5,
            costType: "percentage",
        },
        paymentInformation: {
            bankName: "Bank Inc.",
            accountName: "John Doe",
            accountNumber: "445566998877",
        },
        additionalNotes: "Thank you for your business",
        paymentTerms: "Net 30",
        signature: {
            data: "",
        },
        subTotal: "850",
        totalAmount: "850",
        totalAmountInWords: "Eight Hundred Fifty",
        pdfTemplate: 1,
        isInvoice: false,
    },
};