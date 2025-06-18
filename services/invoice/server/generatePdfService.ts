import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";

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

export async function generatePdfService(body: InvoiceType): Promise<Buffer> {
  await connectToDatabase();

  if (!body.details?.invoiceNumber) {
    throw new Error("Invoice number is missing");
  }

  if (typeof body.details?.pdfTemplate !== "number") {
    throw new Error(
      `PDF template must be a number, received: ${body.details.pdfTemplate}`
    );
  }

  const senderData = body.sender || {
    name: "SPC Source Technical Services LLC",
    country: "UAE",
    state: "Dubai",
    email: "contact@spcsource.com",
    address: "Iris Bay, Office D-43, Business Bay, Dubai, UAE.",
    phone: "+971 54 500 4520",
  };
  const receiver = body.receiver || {
    name: "",
    address: "",
    state: "",
    country: "",
    email: "",
    phone: "",
    additionalNotes: "",
    paymentTerms: "",
  };
  const details = body.details || {};

  const DATE_OPTIONS = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    weekday: "long",
  } as const;

  const formatNumberWithCommas = (num: number): string =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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

  const subtotal = (details.items || []).reduce((sum, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const taxAmount =
    taxDetails.amount && taxDetails.amount > 0
      ? taxDetails.amountType === "percentage"
        ? (subtotal * taxDetails.amount) / 100
        : taxDetails.amount
      : 0;

  const discountAmount =
    discountDetails.amount && discountDetails.amount > 0
      ? discountDetails.amountType === "percentage"
        ? (subtotal * discountDetails.amount) / 100
        : discountDetails.amount
      : 0;

  const shippingAmount =
    shippingDetails.cost && shippingDetails.cost > 0
      ? shippingDetails.costType === "percentage"
        ? (subtotal * shippingDetails.cost) / 100
        : shippingDetails.cost
      : 0;

  const grandTotal = subtotal + taxAmount + shippingAmount - discountAmount;

  const itemsHtml = (details.items || [])
    .map((item: Item, index: number) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const total = quantity * unitPrice;

      return `
        <tr class="border">
          <td class="w-[5%] text-center font-bold text-black text-base border">${index + 1}</td>
          <td class="w-[50%] text-center text-black text-base border px-2 py-1" style="word-wrap: break-word; white-space: normal;">${item.name}</td>
          <td class="w-[10%] text-center text-black text-base border">${quantity}</td>
          <td class="w-[17%] text-center text-black text-base border">${unitPrice ? `${formatNumberWithCommas(unitPrice)}` : ""}</td>
          <td class="w-[18%] text-center text-black text-base border">${total ? `${formatNumberWithCommas(total)}` : ""}</td>
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
  const localTailwindPath = path.resolve(
    process.cwd(),
    "public/tailwind.min.css"
  );
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
  const hasTotalInWords =
    details.totalAmountInWords && details.totalAmountInWords.trim() !== "";

  const taxHtml = hasTax
    ? `
      <p class="text-base text-right text-gray-800">Tax ${
        taxDetails.amountType === "percentage" ? `${taxDetails.amount}%` : "AED"
      }: ${formatNumberWithCommas(Number(taxAmount.toFixed(2)))}</p>
    `
    : "";

  const discountHtml = hasDiscount
    ? `
      <p class="text-base text-right text-gray-800">Discount ${
        discountDetails.amountType === "percentage"
          ? `${discountDetails.amount}%`
          : "AED"
      }: ${formatNumberWithCommas(Number(discountAmount.toFixed(2)))}</p>
    `
    : "";

  const shippingHtml = hasShipping
    ? `
      <p class="text-base text-right text-gray-800">Shipping ${
        shippingDetails.costType === "percentage"
          ? `${shippingDetails.cost}%`
          : "AED"
      }: ${formatNumberWithCommas(Number(shippingAmount.toFixed(2)))}</p>
    `
    : "";

  const totalInWordsHtml = hasTotalInWords
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-sm">Total Amount in Words</h2>
        <p class="font-normal text-sm">${details.totalAmountInWords}</p>
      </div>
    `
    : "";

  const paymentTermsHtml = details.paymentTerms
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-sm">Payment Terms</h2>
        <p class="font-normal text-sm">${details.paymentTerms}</p>
      </div>
    `
    : "";

  const additionalNotesHtml = details.additionalNotes
    ? `
      <div class="mt-2">
        <h2 class="font-bold text-sm">Additional Notes</h2>
        <p class="font-normal text-sm">${details.additionalNotes}</p>
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
        min-height: calc(100vh - 80px); /* Adjusted for footer space */
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
        border-radius: 4px;
        display: inline-block;
        font-weight: bold;
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
        border: 1px solid #000;
      }
      .invoice-table th {
        font-weight: bold;
        text-transform: uppercase;
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
        width: 30%;
      }
      .amount-line {
        margin-bottom: 4px;
      }
      .total-amount {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        text-align: right;
        padding: 8px 0;
        margin-top: 8px;
        font-weight: bold;
      }
      .footer {
        width: calc(100% - 40px);
        padding-top: 10px;
        break-inside: avoid;
        margin-top: 20px; /* Space above footer */
      }
      h3 {
        font-weight: bold;
        margin-top: 5px;
        margin-bottom: 5px;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .container {
          padding-bottom: 80px; /* Ensure space for footer on last page */
        }
        .footer {
          position: static; /* Use static positioning to place footer naturally after content */
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
          <p class="text-sm pt-1">+971 54 500 4520  |  contact@spcsource.com</p>
          <p class="text-sm pt-1">www.spcsource.com  |  TRN-29484858585</p>
          <p class="text-sm pt-1">${
            senderData.address ||
            "Iris Bay, Office D-43, Business Bay, Dubai, UAE."
          }</p>
        </div>
      </div>
      <div class="customer-invoice-container">
        <div class="customer-info">
          <h3 class="font-bold text-lg">CUSTOMER INFO</h3>
          <p class="text-md">${receiver.name || ""}</p>
          <p class="text-md">${receiver.phone || ""}</p>
        </div>
        <div class="invoice-info">
          <h2 class="text-xl">
            <span class="invoice-number">
              ${details.invoiceNumber || ""}
            </span>
          </h2>
          <p class="text-md mt-1">${new Date(
            details.invoiceDate || new Date()
          ).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
        </div>
      </div>
      <div class="mt-4">
        <h3 class="text-lg font-bold">${
          details.invoiceNumber.includes("INV")
            ? `${hasTax ? "TAX " : ""}INVOICE`
            : `QUOTATION`
        }</h3>
        <table class="invoice-table">
          <thead>
            <tr>
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
            <p class="text-base text-right text-gray-800">
              Subtotal: AED ${formatNumberWithCommas(subtotal)}.00
            </p>
            ${taxHtml}
            ${shippingHtml}
            ${discountHtml}
            <p class="total-amount">Grand Total: AED ${formatNumberWithCommas(
              Number(grandTotal.toFixed(2))
            )}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="footer mx-auto">
      <div class="flex justify-between">
        <p class="text-base font-bold text-gray-800">Receiver's Sign _________________</p>
        <p class="text-base text-gray-800">for<span class=" font-bold ">${
          senderData.name || ""
        }</span> </p>
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
      margin: { top: "5mm", right: "5mm", bottom: "20mm", left: "5mm" }, // Increased bottom margin for footer
      preferCSSPageSize: true,
    });

    return pdfBuffer;
  } catch (error: any) {
    console.error("Error generating PDF:", {
      message: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV,
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
