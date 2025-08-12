import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TAILWIND_CDN, INVVariable, QUTVariable } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import { Mail, Globe } from "lucide-react";

interface Receiver {
  name: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  additionalNotes?: string;
  paymentTerms?: string;
}

interface Item {
  name?: string;
  quantity?: number;
  unitPrice?: number;
  unitType?: string;
}

interface Details {
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  items?: Item[];
  taxDetails?: { amount: number; amountType: string; taxID?: string };
  discountDetails?: { amount: number; amountType: string };
  shippingDetails?: { cost: number; costType: string };
  totalAmount?: number;
  pdfTemplate?: number;
  paymentTerms?: string;
  paymentInformation: { accountName: string; accountNumber: string; bankName: string; IBAN: string };
  additionalNotes?: string;
  totalAmountInWords?: string;
  currency?: string;
  isInvoice?: boolean;
}

interface InvoiceType {
  sender?: {
    name: string;
    country: string;
    state: string;
    email: string;
    address: string;
    phone: string;
  };
  receiver?: Receiver;
  details?: Details;
}

const formatPriceToString = (amount: number, currency: string): string => {
  const numberToWords = (num: number): string => {
    const units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];
    const thousands = ["", "thousand", "million", "billion"];

    if (num === 0) return "zero";

    let words = "";
    let numStr = Math.floor(num).toString();
    let chunks: number[] = [];

    while (numStr.length > 0) {
      let chunk = parseInt(numStr.slice(-3)) || 0;
      chunks.push(chunk);
      numStr = numStr.slice(0, -3);
    }

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      if (chunk === 0) continue;

      let chunkWords = "";
      let hundreds = Math.floor(chunk / 100);
      let remainder = chunk % 100;
      let tensPart = Math.floor(remainder / 10);
      let unitsPart = remainder % 10;

      if (hundreds > 0) {
        chunkWords += `${units[hundreds]} hundred`;
        if (remainder > 0) chunkWords += " and ";
      }

      if (remainder >= 10 && remainder < 20) {
        chunkWords += teens[remainder - 10];
      } else {
        if (tensPart > 0) {
          chunkWords += tens[tensPart];
          if (unitsPart > 0) chunkWords += "-";
        }
        if (unitsPart > 0 || remainder === 0) {
          chunkWords += units[unitsPart];
        }
      }

      if (chunkWords && i > 0) {
        chunkWords += ` ${thousands[i]}`;
      }

      words = chunkWords + (words ? " " + words : "");
    }

    return words.trim();
  };

  const [integerPart, decimalPart] = amount.toFixed(2).split(".");
  const integerNum = parseInt(integerPart);
  const decimalNum = parseInt(decimalPart);

  let result = numberToWords(integerNum);
  if (currency === "AED") {
    result += " Dirham";
    if (decimalNum > 0) {
      result += ` and ${numberToWords(decimalNum)} Fils`;
    }
  } else {
    result += ` ${currency}`;
    if (decimalNum > 0) {
      result += ` and ${numberToWords(decimalNum)} Cents`;
    }
  }

  return result.charAt(0).toUpperCase() + result.slice(1);
};

async function generatePdf(invoiceData: InvoiceType): Promise<Buffer> {
  if (!invoiceData.details?.invoiceNumber) {
    console.error("Invoice number missing");
    throw new Error("Invoice number is missing");
  }

  if (typeof invoiceData.details?.pdfTemplate !== "number") {
    console.error("Invalid PDF template:", invoiceData.details?.pdfTemplate);
    throw new Error(
      `PDF template must be a number, received: ${invoiceData.details.pdfTemplate}`
    );
  }

  const senderData = invoiceData.sender || {
    name: "SPC Source Technical Services LLC",
    country: "UAE",
    state: "Dubai",
    email: "contact@spcsource.com",
    address: "Iris Bay, Office D-43, Business Bay, Dubai, UAE.",
    phone: "+971 54 500 4520",
  };
  const receiver = invoiceData.receiver || {
    name: "",
    address: "",
    state: "",
    country: "",
    email: "",
    phone: "",
    additionalNotes: "",
    paymentTerms: "",
  };
  const details = invoiceData.details || {};

const DATE_OPTIONS:any = {
  weekday: 'long',  // Full day (e.g., "Tuesday")
  year: 'numeric',  // Full year (e.g., "2025")
  month: 'long',    // Full month name (e.g., "December")
  day: 'numeric',   // Day of the month (e.g., "8")
};

// Create a date object from the ISO 8601 string
const date = new Date("2025-12-08T00:00:00.000+00:00");

// Get the date formatted using UTC
const formattedDate = date.toLocaleDateString("en-US", {
  ...DATE_OPTIONS,
  timeZone: 'UTC',  // Forces the date to stay in UTC without local time zone adjustment
});

console.log(formattedDate); // "Tuesday, December 8, 2025"






  const formatNumberWithCommas = (num: number): string => {
    const fixedNum = Number(num).toFixed(2);
    const [integerPart, decimalPart] = fixedNum.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${formattedInteger}.${decimalPart}`;
  };

  const taxDetails = details.taxDetails || {
    amount: 0,
    amountType: "percentage",
    taxID: "",
  };
  const discountDetails = details.discountDetails || {
    amount: 0,
    amountType: "amount",
  };
  const shippingDetails = details.shippingDetails || {
    cost: 0,
    costType: "amount",
  };

  const subtotal = Number(
    (details.items || [])
      .reduce((sum, item) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        return sum + quantity * unitPrice;
      }, 0)
      .toFixed(2)
  );

  const taxAmount = Number(
    taxDetails.amount && taxDetails.amount > 0
      ? taxDetails.amountType === "percentage"
        ? ((subtotal * taxDetails.amount) / 100).toFixed(2)
        : taxDetails.amount.toFixed(2)
      : 0
  );

  const discountAmount = Number(
    discountDetails.amount && discountDetails.amount > 0
      ? discountDetails.amountType === "percentage"
        ? ((subtotal * discountDetails.amount) / 100).toFixed(2)
        : discountDetails.amount.toFixed(2)
      : 0
  );

  const shippingAmount = Number(
    shippingDetails.cost && shippingDetails.cost > 0
      ? shippingDetails.costType === "percentage"
        ? ((subtotal * shippingDetails.cost) / 100).toFixed(2)
        : shippingDetails.cost.toFixed(2)
      : 0
  );

  const grandTotal = Number(
    (subtotal + taxAmount + shippingAmount - discountAmount).toFixed(2)
  );

  // Calculate totalAmountInWords but only use it if needed
  const calculatedTotalInWords = formatPriceToString(
    grandTotal,
    details.currency || "AED"
  );

  // Use the totalAmountInWords from invoiceData (from request or database)
  const totalAmountInWords = invoiceData.details?.totalAmountInWords || "";

  const itemsHtml = (details.items || [])
    .map((item: Item, index: number) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const total = quantity * unitPrice;

      return `
        <tr class="border">
          <td class="w-[5%] text-center font-bold text-black text-base border border-gray-500">${
            index + 1
          }</td>
          <td class="w-[40%] text-center text-black text-base border border-gray-500 px-2 py-1" style="word-wrap: break-word; white-space: normal;"><pre class="text-start">${
            item.name || ""
          }</pre></td>
          <td class="w-[10%] text-center text-black text-base border border-gray-500">${
            item.unitType || ""
          }</td>
          <td class="w-[10%] text-center text-black text-base border border-gray-500">${
            quantity ? quantity : ""
          }</td>
          <td class="w-[20%] text-center text-black text-base border border-gray-500">${
            unitPrice ? unitPrice : ""
          }</td>
          <td class="w-[15%] text-center text-black text-base border border-gray-500">${
            total ? total : ""
          }</td>
        </tr>
      `;
    })
    .join("");

  const logoPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "img",
    "image.jpg"
  );
  let logoBase64 = "";
  try {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
    } else {
      console.warn("Logo file not found at:", logoPath);
    }
  } catch (error) {
    console.warn("Error loading logo:", error);
  }

  let tailwindCss = "";
  const localTailwindPath = path.join(
    process.cwd(),
    "public",
    "tailwind.min.css"
  );
  try {
    if (fs.existsSync(localTailwindPath)) {
      tailwindCss = fs.readFileSync(localTailwindPath, "utf8");
    } else {
      const response = await fetch(TAILWIND_CDN, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch Tailwind CSS");
      tailwindCss = await response.text();
    }
  } catch (error) {
    console.warn("Error loading Tailwind CSS:", error);
  }

  const hasTax = taxDetails.amount && taxDetails.amount > 0;
  const hasDiscount = discountDetails.amount && discountDetails.amount > 0;
  const hasShipping = shippingDetails.cost && shippingDetails.cost > 0;
  const hasTotalInWords = totalAmountInWords && totalAmountInWords.trim() !== "";
  const isInvoice = details.isInvoice || false;

  const invoiceNumberPrefix =
    isInvoice && hasTax
      ? `TAX_INV-${details.invoiceNumber}`
      : isInvoice
      ? `INV-${details.invoiceNumber}`
      : `QUT-${details.invoiceNumber}`;

  const taxHtml = hasTax
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">VAT ${
          taxDetails.amountType === "percentage"
            ? `(${taxDetails.amount}%)`
            : ""
        }</span>
        <span class="text-base text-gray-800">${
          details.currency || "AED"
        } ${formatNumberWithCommas(taxAmount)}</span>
      </div>
    `
    : "";

  const discountHtml = hasDiscount
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">Discount ${
          discountDetails.amountType === "percentage"
            ? `(${discountDetails.amount}%)`
            : ""
        }</span>
        <span class="text-base text-gray-800">${
          details.currency || "AED"
        } ${formatNumberWithCommas(discountAmount)}</span>
      </div>
    `
    : "";

  const shippingHtml = hasShipping
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">Shipping ${
          shippingDetails.costType === "percentage"
            ? `(${shippingDetails.cost}%)`
            : ""
        }</span>
        <span class="text-base text-gray-800">${
          details.currency || "AED"
        } ${formatNumberWithCommas(shippingAmount)}</span>
      </div>
    `
    : "";

  const totalInWordsHtml = hasTotalInWords
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-lg">Total Amount in Words</h2>
        <p class="font-normal text-md">${totalAmountInWords}</p>
      </div>
    `
    : "";

  const paymentTermsHtml = details.paymentTerms
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-lg">Terms</h2>
          <td class="w-[40%] text-center text-black text-base border border-gray-500 px-2 py-1" style="word-wrap: break-word; white-space: normal;"><pre class="text-start">${details.paymentTerms}</pre></td>
        
      </div>
    `
    : "";

  const PaymentDetails = details.paymentInformation
    ? `
    <div class="mt-2">
      <h2 class="font-bold text-lg">Payment Details</h2>
      <p class="font-normal text-md"><span class="font-semibold mt-2">Bank:</span> ${details.paymentInformation.bankName}</p>
      <p class="font-normal text-md"><span class="font-semibold">Account Name:</span> ${details.paymentInformation.accountName}</p>
      <p class="font-normal text-md"><span class="font-semibold">Account Number:</span> ${details.paymentInformation.accountNumber}</p>
      <p class="font-normal text-md"><span class="font-semibold">IBAN:</span> ${details.paymentInformation.IBAN ? details.paymentInformation.IBAN : "AE450400000883578428001"}</p>
    </div>
  `
    : "";                                               
                 
  const additionalNotesHtml = details.additionalNotes
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-lg">Additional Notes</h2>
        <p class="font-normal text-md">${details.additionalNotes}</p>
      </div>
    `
    : "";

  const htmlTemplate = `
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
      ${tailwindCss}
      body {
        width:100%;
        font-family: 'Roboto', sans-serif;
        padding:0;
        margin: 0;
        background-color: #ffffff;
        color: #000000;
      }
      .container {
        display: block;
        min-height: calc(100vh - 80px);
        box-sizing: border-box;
        padding: 0;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 5px;
      }
      .logo img {
        width: 180px;
        height: 100px;
        object-fit: contain;
      }
      .header-details {
        text-align: right;
      }
      .invoice-number {
        background-color: #d3d3d3;
        padding: 5px 10px;
        display: inline-block;
        font-weight: bold;
        text-align: right;
      }
      .customer-invoice-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        width: 100%;
        margin-top: 15px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .invoice-table thead tr {
        background-color: #d3d3d3;
      }
      .invoice-table th, .invoice-table td {
        font-size: 14px;
        border: 1px solid rgb(212, 213, 216);
      }
      .invoice-table th {
        font-weight: bold;
        text-transform: uppercase;
        font-size: 16px;
        padding: 8px;
      }
      .invoice-table td {
        word-wrap: break-word;
        white-space: normal;
        padding: 4px;
      }
      .invoice-table th:nth-child(1), .invoice-table td:nth-child(1) { width: 5%; }
      .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) { width: 40%; }
      .invoice-table th:nth-child(3), .invoice-table td:nth-child(3) { width: 10%; }
      .invoice-table th:nth-child(4), .invoice-table td:nth-child(4) { width: 10%; }
      .invoice-table th:nth-child(5), .invoice-table td:nth-child(5) { width: 20%; }
      .invoice-table th:nth-child(6), .invoice-table td:nth-child(6) { width: 15%; }
      .summary {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        width: 100%;
      }
      .notes-section {
        width: 55%;
      }
      .amounts-section {
        width: 35%;
      }
      .amount-line {
        margin-bottom: 4px;
      }
      .total-amount {
        border-top: 1px solid #6b7280;
        border-bottom: 1px solid #6b7280;
        padding: 8px 0;
        margin-top: 8px;
        font-weight: bold;
      }
      .footer {
        width: 100%;
        padding: 0;
        margin-top: 0;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .container {
          padding-bottom: 80px;
        }
        .footer {
          position: fixed;
          bottom: 0;
          margin-top: 0;
        }
      }
      @page {
        margin: 5mm;
        @bottom-right {
          content: "Page " counter(page) " of " counter(pages);
          font-family: 'Roboto', sans-serif;
          font-size: 12px;
          color: #000000;
        }
      }
    </style>
  </head>
  <body>
    <div class="container mx-auto">
      <div class="header">
        <div class="logo">
          ${
            logoBase64
              ? `<img src="${logoBase64}" alt="SPC Source Logo" />`
              : `<p>SPC Source Logo</p>`
          }
        </div>
        <div class="header-details mt-4">
          <p class="text-sm pt-1">
            <a href="https://bit.ly/spc-whatsapp-contact" target="_blank" rel="noopener noreferrer">
              +971 54 500 4520
            </a>
          </p>
          <p class="text-sm pt-1">${
            senderData.address ||
            "Iris Bay, Office D-43, Business Bay, Dubai, UAE."
          }</p>
          <p class="text-sm pt-1">TRN-105078528400003</p>
        </div>
      </div>
      <div class="customer-invoice-container">
        <div class="customer-info">
          <h3 class="font-bold text-lg">CUSTOMER INFO</h3>
          <p class="text-md">${receiver.name || ""}</p>
          <p class="text-md">${receiver.phone || ""}</p>
        </div>
        <div class="invoice-info">
          <h2 class="text-xl text-right">
            <span class="invoice-number">${isInvoice ? "INV-" : "QUT-"}${
    details.invoiceNumber
  }</span>
          </h2>
         <p class="text-md mt-1 text-right">
  ${formattedDate}
</p>

       
        </div>
      </div>
      <div class="mt-4">
        <h3 class="text-lg font-bold">${
          isInvoice ? `${hasTax ? "TAX" : ""} INVOICE` : "QUOTATION"
        }</h3>
        <table class="invoice-table">
          <thead>
            <tr class="py-8">
              <th class="w-[5%] text-center">#</th>
              <th class="w-[40%] text-center">DESCRIPTION</th>
              <th class="w-[10%] text-center">UNIT</th>
              <th class="w-[10%] text-center">QTY</th>
              <th class="w-[20%] text-center">UNIT PRICE</th>
              <th class="w-[15%] text-center">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="summary">
          <div class="notes-section">
            ${paymentTermsHtml}
            
            ${PaymentDetails}
          </div>
          <div class="amounts-section">
            <div class="flex justify-between amount-line">
              <span class="text-base text-gray-800">Subtotal</span>
              <span class="text-base text-gray-800">${
                details.currency || "AED"
              } ${formatNumberWithCommas(subtotal)}</span>
            </div>
            ${shippingHtml}
            ${discountHtml}
            ${taxHtml}
            <div class="flex justify-between total-amount">
              <span class="text-base font-bold text-gray-800">Grand Total</span>
              <span class="text-base font-bold text-gray-800">${
                details.currency || "AED"
              } ${formatNumberWithCommas(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer w-full">
      <div class="flex justify-between">
        <p class="text-base font-bold text-gray-800 ">Receiver's Sign _________________</p>
        <p class="text-base text-gray-800">for <span class="font-bold">${
          senderData.name || ""
        }</span></p>
      </div>
      <div class="flex justify-between h-[10px] mt-1 p-2 w-full" style="background-color: #FFA733;">
        <p class="flex"> 
          <svg class="mt-1 mr-1 w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="4" height="4" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m3.5 5.5 7.893 6.036a1 1 0 0 0 1.214 0L20.5 5.5M4 19h16a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"/>
          </svg>
          contact@spcsource.com
        </p>
        <p class="flex">
          <svg class="mt-1 mr-1 w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="4" height="4" fill="currentColor" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M8.64 4.737A7.97 7.97 0 0 1 12 4a7.997 7.997 0 0 1 6.933 4.006h-.738c-.65 0-1.177.25-1.177.9 0 .33 0 2.04-2.026 2.008-1.972 0-1.972-1.732-1.972-2.008 0-1.429-.787-1.65-1.752-1.923-.374-.105-.774-.218-1.166-.411-1.004-.497-1.347-1.183-1.461-1.835ZM6 4a10.06 10.06 0 0 0-2.812 3.27A9.956 9.956 0 0 0 2 12c0 5.289 4.106 9.619 9.304 9.976l.054.004a10.12 10.12 0 0 0 1.155.007h.002a10.024 10.024 0 0 0 1.5-.19 9.925 9.925 0 0 0 2.259-.754 10.041 10.041 0 0 0 4.987-5.263A9.917 9.917 0 0 0 22 12a10.025 10.025 0 0 0-.315-2.5A10.001 10.001 0 0 0 12 2a9.964 9.964 0 0 0-6 2Zm13.372 11.113a2.575 2.575 0 0 0-.75-.112h-.217A3.405 3.405 0 0 0 15 18.405v1.014a8.027 8.027 0 0 0 4.372-4.307ZM12.114 20H12A8 8 0 0 1 5.1 7.95c.95.541 1.421 1.537 1.835 2.415.209.441.403.853.637 1.162.54.712 1.063 1.019 1.591 1.328.52.305 1.047.613 1.6 1.316 1.44 1.825 1.419 4.366 1.35 5.828Z" clip-rule="evenodd"/>
          </svg>
          www.spcsource.com
        </p> 
      </div>
    </div>
  </body>
</html>
`;

  let browser = null;
  try {
    const launchOptions: any = {
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process",
        "--disable-gpu",
        "--no-zygote",
      ],
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
      ),
      headless: "new",
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
      timeout: 60000,
    };

    browser = await puppeteerCore.launch(launchOptions);

    const page = await browser.newPage();

    await page.setContent(htmlTemplate, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const pdfBuffer: any = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "5mm", right: "5mm", bottom: "20mm", left: "5mm" },
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } catch (error: any) {
    console.error("Error generating PDF:", {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace",
      env: process.env.NODE_ENV,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, invoiceData } = body;

    if (!invoiceData?.details?.invoiceNumber) {
      console.error("Missing invoice number in POST request");
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    const pdfBuffer = await generatePdf(invoiceData);

    const isInvoice = invoiceData.details.isInvoice || false;
    const hasTaxDetails = !!invoiceData.details.taxDetails;
    const taxAmount = hasTaxDetails
      ? Number(invoiceData.details.taxDetails?.amount)
      : 0;
    const numericInvoiceNumber = invoiceData.details.invoiceNumber.replace(
      /\D/g,
      ""
    );

    let fileName = "";
    if (isInvoice && taxAmount > 0) {
      fileName = `SPC_TAX_INV_${numericInvoiceNumber}.pdf`;
    } else if (isInvoice && taxAmount <= 0) {
      fileName = `SPC_INV_${numericInvoiceNumber}.pdf`;
    } else {
      fileName = `SPC_QUT_${numericInvoiceNumber}.pdf`;
    }

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        fileName
      )}"`,
      "Content-Length": pdfBuffer.length.toString(),
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error in POST handler:", {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace",
    });
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const invoiceNumber = url.searchParams.get("invoiceNumber");

    if (!invoiceNumber) {
      console.error("Missing invoice number in GET request");
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    const invoiceData = await db.collection("invoices").findOne({
      "details.invoiceNumber": invoiceNumber,
    });

    if (!invoiceData) {
      console.error("Invoice not found for number:", invoiceNumber);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBuffer = await generatePdf(invoiceData);

    const isInvoice = invoiceData.details?.isInvoice || false;
    const hasTaxDetails = !!invoiceData.details?.taxDetails;
    const taxAmount = hasTaxDetails
      ? Number(invoiceData.details?.taxDetails?.amount)
      : 0;
    const numericInvoiceNumber = invoiceData.details?.invoiceNumber.replace(
      /\D/g,
      ""
    );

    let fileName = "";
    if (isInvoice && taxAmount > 0) {
      fileName = `SPC_TAX_INV_${numericInvoiceNumber}.pdf`;
    } else if (isInvoice && taxAmount <= 0) {
      fileName = `SPC_INV_${numericInvoiceNumber}.pdf`;
    } else {
      fileName = `SPC_QUT_${numericInvoiceNumber}.pdf`;
    }

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        fileName
      )}"`,
      "Content-Length": pdfBuffer.length.toString(),
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    });

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error in GET handler:", {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace",
    });
    return NextResponse.json(
      { error: error.message || "Failed to regenerate PDF" },
      { status: 500 }
    );
  }
}