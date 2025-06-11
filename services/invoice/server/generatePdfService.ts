import { InvoiceType } from "@/types";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

interface Item {
  name: string;
  quantity: number;
  unitPrice: number;
}

export async function generatePdfService(body: InvoiceType): Promise<Buffer> {
  let browser = null;

  try {
    await connectToDatabase();

    // Validate input
    if (!body.details?.invoiceNumber) {
      throw new Error("Invoice number is required");
    }
    if (typeof body.details?.pdfTemplate !== "number") {
      throw new Error(
        `PDF template must be a number, received: ${body.details.pdfTemplate}`
      );
    }
    if (!body.sender || !body.receiver || !body.details?.items?.length) {
      throw new Error("Sender, receiver, and items are required");
    }

    // Generate HTML content
    const htmlContent = await generateHtml(body);

    // Launch browser with Vercel-optimized settings
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      ignoreHTTPSErrors: true,
      defaultViewport: chromium.defaultViewport,
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    if (!pdf || pdf.length === 0) {
      throw new Error("Generated PDF is empty");
    }

    return pdf;
  } catch (error: any) {
    console.error("PDF generation failed:", error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function generateHtml(body: InvoiceType): Promise<string> {
  const senderData = body.sender || {};
  const receiver = body.receiver || {};
  const details = body.details || {};

  // Date formatting
  const DATE_OPTIONS = {
    year: "numeric",
    month: "long",
    day: "2-digit",
    weekday: "long",
  } as const;

  const formatNumberWithCommas = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Generate items HTML
  const itemsHtml = (details.items || []).map((item: Item, index: number) => {
    return `
      <tr style="border: 1px solid #000;">
        <td style="padding: 12px 16px; width: 5%; border: 1px solid #000; color: #000; font-size: 14px;">${index + 1}</td>
        <td style="padding: 12px 16px; width: 50%; border: 1px solid #000; color: #000; font-size: 14px;">${item.name || ""}</td>
        <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px; text-align: right;">${item.quantity || ""}</td>
        <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px; text-align: right;">${item.unitPrice ? `${item.unitPrice}` : ""}</td>
        <td style="padding: 12px 16px; width: 15%; border: 1px solid #000; color: #000; font-size: 14px; text-align: right;">${item.quantity && item.unitPrice ? `${item.quantity * item.unitPrice}` : ""}</td>
      </tr>
    `;
  }).join("\n");

  // Handle logo
  let logoBase64 = "";
  try {
    const logoPath = path.join(process.cwd(), "public", "assets", "img", "image.jpg");
    const logoBuffer = await fs.promises.readFile(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
  } catch (error) {
    console.warn("Logo loading failed, continuing without logo");
  }

  // Get CSS
  let tailwindCss = "";
  try {
    const response = await fetch(TAILWIND_CDN);
    tailwindCss = await response.text();
  } catch (error) {
    console.warn("Using fallback CSS");
    tailwindCss = `
      .text-right { text-align: right; }
      .header { display: flex; justify-content: space-between; }
      .invoice-table { width: 100%; border-collapse: collapse; }
      .invoice-table th { padding: 12px 16px; font-weight: bold; }
      .invoice-table td { padding: 12px 16px; }
    `;
  }

  // Calculate totals
  const taxDetails = details.taxDetails || { amount: 0, amountType: "amount" };
  const discountDetails = details.discountDetails || { amount: 0, amountType: "amount" };
  const shippingDetails = details.shippingDetails || { cost: 0, costType: "amount" };

  const taxAmount = taxDetails.amountType === "percentage"
    ? (details.subTotal || 0) * (taxDetails.amount / 100)
    : taxDetails.amount;

  const discountAmount = discountDetails.amountType === "percentage"
    ? (details.subTotal || 0) * (discountDetails.amount / 100)
    : discountDetails.amount;

  const shippingCost = shippingDetails.costType === "percentage"
    ? (details.subTotal || 0) * (shippingDetails.cost / 100)
    : shippingDetails.cost;

  const grandTotal = (details.subTotal || 0) + taxAmount - discountAmount + shippingCost;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${tailwindCss}</style>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .logo img {
            max-height: 80px;
          }
          .invoice-info {
            text-align: right;
          }
          .customer-info {
            margin-bottom: 20px;
          }
          .invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .invoice-table th {
            background-color: #f3f4f6;
            padding: 12px;
            text-align: left;
            border: 1px solid #d1d5db;
          }
          .invoice-table td {
            padding: 12px;
            border: 1px solid #d1d5db;
          }
          .totals {
            margin-top: 30px;
            text-align: right;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Company Logo">` : ''}
            <h2>${senderData.name || ""}</h2>
            <p>${senderData.address || ""}</p>
            <p>${senderData.phone || ""}</p>
          </div>
          <div class="invoice-info">
            <h1>${details.invoiceNumber.includes("INV") ? "INVOICE" : "QUOTATION"}</h1>
            <p><strong>Number:</strong> ${details.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(details.invoiceDate || new Date()).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Bill To:</h3>
          <h2>${receiver.name || ""}</h2>
          <p>${receiver.address || ""}</p>
          ${receiver.phone ? `<p>Phone: ${receiver.phone}</p>` : ''}
        </div>

        <table class="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          ${details.subTotal ? `
            <p><strong>Subtotal:</strong> ${formatNumberWithCommas(details.subTotal)} AED</p>
          ` : ''}
          
          ${taxDetails.amount ? `
            <p><strong>Tax (${taxDetails.amountType === 'percentage' ? taxDetails.amount + '%' : 'Flat'}):</strong> 
            ${formatNumberWithCommas(taxAmount)} AED</p>
          ` : ''}
          
          ${discountDetails.amount ? `
            <p><strong>Discount (${discountDetails.amountType === 'percentage' ? discountDetails.amount + '%' : 'Flat'}):</strong> 
            -${formatNumberWithCommas(discountAmount)} AED</p>
          ` : ''}
          
          ${shippingDetails.cost ? `
            <p><strong>Shipping (${shippingDetails.costType === 'percentage' ? shippingDetails.cost + '%' : 'Flat'}):</strong> 
            ${formatNumberWithCommas(shippingCost)} AED</p>
          ` : ''}
          
          <h3><strong>Total:</strong> ${formatNumberWithCommas(grandTotal)} AED</h3>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <div style="margin-top: 40px; display: flex; justify-content: space-between;">
            <div>
              <p>Customer Signature</p>
              <p>_________________________</p>
            </div>
            <div>
              <p>Authorized Signature</p>
              <p>_________________________</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}