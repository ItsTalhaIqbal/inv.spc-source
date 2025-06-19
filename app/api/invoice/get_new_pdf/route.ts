import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { Readable } from "stream";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import fs from "fs";
import path from "path";
import { TAILWIND_CDN } from "@/lib/variables";
import { generatePdfService } from "@/services/invoice/server/generatePdfService";

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
}

interface Details {
  invoiceNumber: string;
  invoiceDate?: string;
  items?: Item[];
  taxDetails?: { amount: number; amountType: string; taxID?: string };
  discountDetails?: { amount: number; amountType: string };
  shippingDetails?: { cost: number; costType: string };
  totalAmount?: number;
  pdfTemplate?: number;
  paymentTerms?: string;
  additionalNotes?: string;
  totalAmountInWords?: string;
  currency?: string;
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
      "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    ];
    const teens = [
      "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
      "seventeen", "eighteen", "nineteen",
    ];
    const tens = [
      "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
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
    throw new Error("Invoice number is missing");
  }

  if (typeof invoiceData.details?.pdfTemplate !== "number") {
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

  const DATE_OPTIONS = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    weekday: "long",
  } as const;

  const formatNumberWithCommas = (num: number): string => {
    const fixedNum = Number(num).toFixed(2);
    const [integerPart, decimalPart] = fixedNum.split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${formattedInteger}.${decimalPart}`;
  };

  const taxDetails = details.taxDetails || {
    amount: 0,
    amountType: "amount",
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
    (details.items || []).reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + quantity * unitPrice;
    }, 0).toFixed(2)
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

  const totalAmountInWords = formatPriceToString(grandTotal, details.currency || "AED");

  const itemsHtml = (details.items || [])
    .map((item: Item, index: number) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const total = quantity * unitPrice;

      return `
        <tr class="border">
          <td class="w-[5%] text-center font-bold text-black text-base border border-gray-500">${index + 1}</td>
          <td class="w-[50%] text-center text-black text-base border border-gray-500 px-2 py-1" style="word-wrap: break-word; white-space: normal;">${item.name}</td>
          <td class="w-[10%] text-center text-black text-base border border-gray-500">${quantity}</td>
          <td class="w-[17%] text-center text-black text-base border border-gray-500">${unitPrice || ""}</td>
          <td class="w-[18%] text-center text-black text-base border border-gray-500">${total || ""}</td>
        </tr>
      `;
    })
    .join("");

  const logoPath = path.resolve(process.cwd(), "public/assets/img/image.jpg");
  let logoBase64 = "";
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
  } catch (error) {
    console.warn("Could not load logo:", error);
  }

  let tailwindCss = "";
  const localTailwindPath = path.resolve(process.cwd(), "public/tailwind.min.css");
  try {
    if (fs.existsSync(localTailwindPath)) {
      tailwindCss = fs.readFileSync(localTailwindPath, "utf8");
    } else {
      const response = await fetch(TAILWIND_CDN);
      tailwindCss = await response.text();
    }
  } catch (error) {
    console.warn("Could not load Tailwind CSS:", error);
  }

  const hasTax = taxDetails.amount && taxDetails.amount > 0;
  const hasDiscount = discountDetails.amount && discountDetails.amount > 0;
  const hasShipping = shippingDetails.cost && shippingDetails.cost > 0;
  const hasTotalInWords = totalAmountInWords && totalAmountInWords.trim() !== "";

  const invoiceNumberPrefix = hasTax ? `INV-${details.invoiceNumber}` : `QUT-${details.invoiceNumber}`;

  const taxHtml = hasTax
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">VAT ${taxDetails.amountType === "percentage" ? `(${taxDetails.amount}%)` : ""}</span>
        <span class="text-base text-gray-800">AED ${formatNumberWithCommas(taxAmount)}</span>
      </div>
    `
    : "";

  const discountHtml = hasDiscount
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">Discount ${discountDetails.amountType === "percentage" ? `(${discountDetails.amount}%)` : ""}</span>
        <span class="text-base text-gray-800">AED ${formatNumberWithCommas(discountAmount)}</span>
      </div>
    `
    : "";

  const shippingHtml = hasShipping
    ? `
      <div class="flex justify-between amount-line">
        <span class="text-base text-gray-800">Shipping ${shippingDetails.costType === "percentage" ? `(${shippingDetails.cost}%)` : ""}</span>
        <span class="text-base text-gray-800">AED ${formatNumberWithCommas(shippingAmount)}</span>
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
        <h2 class="font-bold text-lg">Payment Terms</h2>
        <p class="font-normal text-md">${details.paymentTerms}</p>
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
        font-family: 'Roboto', sans-serif;
        margin: 0;
        padding: 0 20px;
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
        border: 1px solid #6b7280;
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
      .invoice-table th:nth-child(2), .invoice-table td:nth-child(2) { width: 50%; }
      .invoice-table th:nth-child(3), .invoice-table td:nth-child(3) { width: 10%; }
      .invoice-table th:nth-child(4), .invoice-table td:nth-child(4) { width: 17%; }
      .invoice-table th:nth-child(5), .invoice-table td:nth-child(5) { width: 18%; }
      .summary {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        width: 100%;
      }
      .notes-section {
        width: 55%;
        break-inside: avoid;
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
        width: calc(100% - 40px);
        padding-top: 10px;
        break-inside: avoid;
        margin-top: 20px;
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
          position: static;
          margin-top: 20px;
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
      .container, .summary, .notes-section, .amounts-section {
        page-break-inside: avoid;
      }
      .invoice-table tr {
        page-break-inside: avoid;
      }
    </style>
  </head>
  <body>
    <div class="container mx-auto">
      <div class="header">
        <div class="logo">
          <img src="${logoBase64}" alt="SPC Source Logo" />
        </div>
        <div class="header-details mt-4">
          <p class="text-sm pt-1">
            <a href="https://api.whatsapp.com/send?phone=971545004520&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer">
              +971 54 500 4520
            </a> | contact@spcsource.com
          </p>
          <p class="text-sm pt-1"></p>
          <p class="text-sm pt-1">www.spcsource.com | TRN-29484858585</p>
          <p class="text-sm pt-1">${senderData.address || "Iris Bay, Office D-43, Business Bay, Dubai, UAE."}</p>
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
            <span class="invoice-number">
              ${invoiceNumberPrefix}
            </span>
          </h2>
          <p class="text-md mt-1">${new Date(details.invoiceDate || new Date()).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
        </div>
      </div>
      <div class="mt-4">
        <h3 class="text-lg font-bold">${hasTax ? "TAX INVOICE" : "QUOTATION"}</h3>
        <table class="invoice-table">
          <thead>
            <tr class="py-8">
              <th class="w-[5%] text-center">#</th>
              <th class="w-[50%] text-center">DESCRIPTION</th>
              <th class="w-[10%] text-center">QTY</th>
              <th class="w-[17%] text-center">UNIT PRICE</th>
              <th class="w-[18%] text-center">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="summary">
          <div class="notes-section">
            ${additionalNotesHtml}
            ${paymentTermsHtml}
            ${totalInWordsHtml}
          </div>
          <div class="amounts-section">
            <div class="flex justify-between amount-line">
              <span class="text-base text-gray-800">Subtotal</span>
              <span class="text-base text-gray-800">AED ${formatNumberWithCommas(subtotal)}</span>
            </div>
            ${taxHtml}
            ${shippingHtml}
            ${discountHtml}
            <div class="flex justify-between total-amount">
              <span class="text-base font-bold text-gray-800">Grand Total</span>
              <span class="text-base font-bold text-gray-800">AED ${formatNumberWithCommas(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer mx-auto">
      <div class="flex justify-between">
        <p class="text-base font-bold text-gray-800 ml-3">Receiver's Sign _________________</p>
        <p class="text-base text-gray-800">for <span class="font-bold">${senderData.name || ""}</span></p>
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
      ],
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
      ),
      headless: "new",
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    };

    browser = await puppeteerCore.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(htmlTemplate, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
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
    await connectToDatabase();
    const body = await req.json();
    const { action, invoiceData } = body;

    if (!invoiceData?.details?.invoiceNumber) {
      throw new Error("Invoice number is required");
    }

    const data = invoiceData;
    if (typeof data?.details?.totalAmount !== "number") {
      throw new Error("Total amount must be a number");
    }

    const pdfBuffer = await generatePdfService(data);

    // Determine if it's an invoice or quotation
    const isInvoice = !!data.details.taxDetails; // Invoice if taxDetails exists
    const hasTax = isInvoice && data.details.taxDetails?.amount > 0;

    // Set file name based on type and tax
    let invoiceNumberPrefix;
    if (isInvoice) {
      invoiceNumberPrefix = hasTax ? `TAX_INV` : `INV`;
    } else {
      invoiceNumberPrefix = `QUT`;
    }
    const fileName = `SPC_${invoiceNumberPrefix}_${data.details.invoiceNumber}.pdf`;

    console.log("POST file name:", fileName); // Debug log

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": pdfBuffer.length.toString(),
    });

    const stream:any = new Readable();
    stream.push(pdfBuffer);
    stream.push(null);

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error:any) {
    console.error("Error in PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}



export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const invoiceNumber = url.searchParams.get("invoiceNumber");

    if (!invoiceNumber) {
      return NextResponse.json(
        Response.json({ error: "Invoice number is required" }),
        { status: 400 }
      );
    }
    let savedInvoices: InvoiceType[] = [];
    try {
      const savedInvoicesJSON = await fs.readFileSync(
        path.resolve(process.cwd(), "data/savedInvoices.json"),
        "utf8"
      );
      savedInvoices = JSON.parse(savedInvoicesJSON);
    } catch (error) {
      console.warn("Could not load saved invoices:", error);
    }

    const invoiceData = savedInvoices.find(
      (invoice: any) =>
        invoice.details?.invoiceNumber?.toString().replace(/\D/g, "") ===
        invoiceNumber.toString().replace(/\D/g, "")
    );

    if (!invoiceData) {
      return NextResponse.json(
        { error: "Invalid invoice not found" },
        { status: 404 }
      );
    }
    const pdfBuffer = await generatePdf(invoiceData);

    const hasTax = invoiceData.details?.taxDetails?.amount && invoiceData.details.taxDetails.amount > 0;
    const invoiceNumberPrefix = hasTax ? `INV_${invoiceData.details?.invoiceNumber}` : `QUT_${invoiceData.details?.invoiceNumber}`;
    const fileName = `SPC_${invoiceNumberPrefix}.pdf`;

    console.log("GET invoice file name:", fileName); // Debug log

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Content-Length": pdfBuffer.length.toString(),
    });

    const stream: any = Readable.from(pdfBuffer);

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error in regenerating PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to regenerate PDF" },
      { status: 500 }
    );
  }
}
