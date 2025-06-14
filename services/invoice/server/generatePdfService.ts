import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";

// Define TypeScript interfaces for better type safety
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
  taxDetails?: { amount: number; amountType: string };
  discountDetails?: { amount: number; amountType: string };
  shippingDetails?: { cost: number; costType: string };
  totalAmount?: number;
  pdfTemplate?: number;
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

  // Debug log to inspect input data
  console.log("Input body:", JSON.stringify(body, null, 2));

  if (!body.details?.invoiceNumber) {
    throw new Error("Invoice number is missing");
  }

  if (typeof body.details?.pdfTemplate !== "number") {
    throw new Error(
      `PDF template must be a number, received: ${body.details.pdfTemplate}`
    );
  }

  // Prepare data with default values
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

  // Date formatting options
  const DATE_OPTIONS = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    weekday: "long",
  } as const;

  // Helper functions
  const formatNumberWithCommas = (num: number): string =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Generate items HTML
  const itemsHtml = (details.items || [])
    .map((item: Item, index: number) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const total = quantity * unitPrice;

      return `
        <tr class="border">
          <td class="p-3 w-1/20 font-bold text-black text-base border">${index + 1}</td>
          <td class="p-3 w-1/2 text-black text-base border">${item.name || ""}</td>
          <td class="p-3 w-1/6 text-black text-base border">${quantity}</td>
          <td class="p-3 w-1/6 text-black text-base border">${unitPrice ? `${unitPrice} ` : ""}</td>
          <td class="p-3 w-1/6 text-right text-black text-base border">${total ? `${total} ` : ""}</td>
        </tr>
      `;
    })
    .join("");

  // Load logo
  const logoPath = path.resolve(process.cwd(), "public/assets/img/image.jpg");
  let logoBase64 = "";
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
  } catch (error) {
    console.warn("Could not load logo:", error);
  }

  // Load Tailwind CSS
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

  // Prepare tax, discount, and shipping details
  const taxDetails = details.taxDetails || { amount: 0, amountType: "amount" };
  const discountDetails = details.discountDetails || {
    amount: 0,
    amountType: "amount",
  };
  const shippingDetails = details.shippingDetails || {
    cost: 0,
    costType: "amount",
  };

  const hasTax = taxDetails.amount && taxDetails.amount > 0;
  const hasDiscount = discountDetails.amount && discountDetails.amount > 0;
  const hasShipping = shippingDetails.cost && shippingDetails.cost > 0;

  const taxHtml = hasTax
    ? `
      <p class="text-base font-bold text-gray-800">Tax (${
        taxDetails.amountType === "amount" ? "AED" : "%"
      })</p>
      <p class="text-base text-gray-800">${formatNumberWithCommas(
        Number(taxDetails.amount)
      )} ${taxDetails.amountType === "amount" ? "AED" : ""}</p>
    `
    : "";

  const discountHtml = hasDiscount
    ? `
      <p class="text-base font-bold text-gray-800">Discount (${
        discountDetails.amountType === "amount" ? "AED" : "%"
      })</p>
      <p class="text-base text-gray-800">${formatNumberWithCommas(
        Number(discountDetails.amount)
      )} ${discountDetails.amountType === "amount" ? "AED" : ""}</p>
    `
    : "";

  const shippingHtml = hasShipping
    ? `
      <p class="text-base font-bold text-gray-800">Shipping (${
        shippingDetails.costType === "amount" ? "AED" : "%"
      })</p>
      <p class="text-base text-gray-800">${formatNumberWithCommas(
        Number(shippingDetails.cost)
      )} ${shippingDetails.costType === "amount" ? "AED" : ""}</p>
    `
    : "";

  // Generate HTML template
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
        padding: 0;
        background-color: #ffffff;
        color: #000000;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        position: relative;
        min-height: 100vh; /* Ensure body takes full height */
      }
      .container {
        width: 100%;
        padding: 0;
      }
      .main-content {
        padding: 20px; /* Add padding to main content */
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
      }
      .logo {
        margin: 0;
        padding: 0;
      }
      .logo img {
        width: 180px;
        height: 100px;
      }
      .invoice-details {
        text-align: right;
      }
      .invoice-number {
        background-color: #d3d3d3;
        padding: 5px 10px;
        border-radius: 4px;
        display: inline-block;
        font-weight: bold;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .invoice-table thead tr {
        background-color: #d3d3d3;
      }
      .invoice-table th {
        padding: 12px 16px;
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        color: #000;
        text-align: left;
        border: 1px solid #000;
      }
      .invoice-table th:last-child {
        text-align: right;
      }
      .invoice-table td {
        padding: 12px 16px;
        font-size: 14px;
        border: 1px solid #000;
      }
      .invoice-table td:last-child {
        text-align: right;
      }
      .summary {
        margin-top: 20px;
        text-align: right;
        font-weight: bold;
        width: 100%;
      }
      .footer {
        position: absolute;
        bottom: 0; /* Keep footer at the bottom */
        width: 100%;
        border-top: 1px solid #000;
        padding-top: 10px;
      }
      .footer-signatures {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .footer-bar {
        background-color: #f4a261;
        color: #000;
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      .footer-bar svg {
        margin-right: 8px;
      }
      h3 {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="main-content"> <!-- New div for main content with padding -->
        <div class="header">
          <div class="logo">
            <img src="${logoBase64}" alt="SPC Source Logo" />
          </div>
          <div class="invoice-details mt-4">
            <p class="text-sm">+971 54 500 4520</p>
            <p class="text-sm">Iris Bay, Office D-43, Business Bay, Dubai</p>
            <h2 class="text-xl mt-5">
              <span class="invoice-number">
                ${
                  details.invoiceNumber.includes("INV")
                    ? "INVOICE# "
                    : "QUOTATION# "
                }
                ${details.invoiceNumber || ""}
              </span>
            </h2>
            <p class="text-md">${new Date(
              details.invoiceDate || new Date()
            ).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
          </div>
        </div>

        <div class="mt-6">
          <h3>CUSTOMER INFO</h3>
          <p class="text-lg">${receiver.name || ""}</p>
        </div>

        <div class="mt-4">
          <h3>${
            details.invoiceNumber.includes("INV") ? "INVOICE" : "QUOTATION"
          }</h3>
          <table class="invoice-table">
            <thead>
              <tr>
                <th class="w-1/20">Sr.</th>
                <th class="w-1/2">Item</th>
                <th class="w-1/6">Qty</th>
                <th class="w-1/6">Unit Price</th>
                <th class="w-1/6">Amount (AED)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="summary">
            <div>
              <div>
                <h2>Additional Notes</h2>
                <p>${receiver.additionalNotes ?? "N/A"}</p>
              </div>
              <div>
                <h2>Payment Terms</h2>
                <p>${receiver.paymentTerms ?? "N/A"}</p>
              </div>     
            </div>
            ${taxHtml ? `<p>${taxHtml}</p>` : ""}
            ${shippingHtml ? `<p>${shippingHtml}</p>` : ""}
            ${discountHtml ? `<p>${discountHtml}</p>` : ""}
            <p>Total ${formatNumberWithCommas(
              Number(details.totalAmount || 0)
            )} AED</p>
          </div>
        </div>
      </div> <!-- End of main-content div -->
      
      <div class="footer"> <!-- Footer remains unchanged -->
        <div class="footer-signatures">
          <p>Receiver's Sign _____________</p>
          <p>for ${senderData.name || "SPC SOURCE TECHNICAL SERVICES LLC"}</p>
        </div>
        <div class="footer-bar">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>${senderData.email || "contact@spcsource.com"}</span>
          </div>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
            <span>www.spcsource.com</span>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

  // Clean up /tmp to avoid ETXTBSY
  try {
    const tmpDir = "/tmp";
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir);
      for (const file of files) {
        if (file.startsWith("chromium") || file.includes("puppeteer")) {
          fs.unlinkSync(path.join(tmpDir, file));
        }
      }
    }
  } catch (cleanupError) {
    console.warn("Failed to clean /tmp:", cleanupError);
  }

  // Generate PDF
  let browser = null;
  try {
    // Configure Puppeteer for Vercel
    const launchOptions:any = {
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

    console.log("Chromium executable path:", launchOptions.executablePath); // Debug log

    browser = await puppeteerCore.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(htmlTemplate, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfBuffer:any = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return pdfBuffer;
  } catch (error: any) {
    console.error("Error generating PDF:", {
      message: error.message,
      stack: error.stack,
      env: process.env.NODE_ENV,
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
      ),
    });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
