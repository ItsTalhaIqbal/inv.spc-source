import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import { InvoiceType } from "@/types";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";

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

  // Prepare data
  const senderData = body.sender || {};
  const receiver = body.receiver || {};
  const details = body.details || {};

  // Date formatting options
  const DATE_OPTIONS = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    weekday: "long",
  } as const;

  // Helper functions
  const formatNumberWithCommas = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Generate items HTML
  const itemsHtml = (body.details?.items || [])
    .map((item: any, index: number) => {
      return `
        <tr style="border: 1px solid #000;">
          <td style="padding: 12px 16px; width: 5%; border: 1px solid #000; color: #000; font-size: 14px;">${
            index + 1
          }</td>
          <td style="padding: 12px 16px; width: 50%; border: 1px solid #000; color: #000; font-size: 14px;">${
            item.name || ""
          }</td>
          <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px;">${
            item.quantity || ""
          }</td>
          <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px;">${
            item.unitPrice ? `${item.unitPrice} ` : ""
          }</td>
          <td style="padding: 12px 16px; width: 15%; text-align: right; border: 1px solid #000; color: #000; font-size: 14px;">${
            item.quantity && item.unitPrice
              ? `${item.quantity * item.unitPrice} `
              : ""
          }</td>
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

  // Load Tailwind CSS (prefer local file, fallback to CDN)
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
      ${tailwindCss}
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 40px;
        background-color: #ffffff;
        color: #000000;
        height: 842px;
        width: 595px;
        box-sizing: border-box;
        position: relative;
      }
      .container {
        max-width: 595px;
        margin: 0 auto;
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
        width: 140px;
        height: 100px;
      }
      .invoice-details {
        text-align: right;
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
      }
      .footer {
        position: absolute;
        bottom: 40px;
        width: 100%;
        left: 40px;
        right: 40px;
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
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <img src="${logoBase64}" alt="SPC Source Logo" />
        </div>
        <div class="invoice-details">
          <p class="text-sm text-gray-800">Iris Bay, Office D-43, Business Bay, Dubai</p>
          <h2 class="text-xl font-bold text-gray-800">
            ${details.invoiceNumber.includes("INV") ? "INVOICE# " : "QUOTATION# "}
            <span class="text-lg font-normal">${details.invoiceNumber || ""}</span>
          </h2>
          <p class="text-sm text-gray-800">${new Date(details.invoiceDate || new Date()).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-sm font-bold text-gray-800 uppercase">Customer Info</h3>
        <h3 class="text-lg text-gray-800">${receiver.name || ""}</h3>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th style="width: 5%;">Sr.</th>
            <th style="width: 50%;">Description</th>
            <th style="width: 15%;">Qty</th>
            <th style="width: 15%;">Unit Price</th>
            <th style="width: 15%;">Amount (AED)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary">
        ${taxHtml}
        ${discountHtml}
        ${shippingHtml}
        <p class="text-base font-bold text-gray-800">Total ${formatNumberWithCommas(Number(details.totalAmount || 0))} AED</p>
      </div>

      <div class="footer">
        <div class="footer-signatures">
          <p class="text-sm font-bold text-gray-800">Receiver's Sign _________________</p>
          <p class="text-sm font-bold text-gray-800">for ${senderData.name || "SPC SOURCE TECHNICAL SERVICES LLC"}</p>
        </div>
        <div class="footer-bar">
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span class="text-sm">${senderData.email || "contact@spcsource.com"}</span>
          </div>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
            <span class="text-sm">www.spcsource.com</span>
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
    const launchOptions = {
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

    browser = await puppeteerCore.launch(launchOptions as any);
    const page = await browser.newPage();

    await page.setContent(htmlTemplate, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfBuffer: any = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "50px", right: "50px", bottom: "50px", left: "50px" },
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
