import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";

// Define TypeScript interfaces
interface Receiver {
  name: string;
  phone?: string;
}

interface Item {
  name?: string;
  quantity?: number;
  unitPrice?: number;
  taxable?: number;
  taxPercent?: number;
  total?: number;
}

interface Details {
  invoiceNumber: string;
  invoiceDate?: string;
  items?: Item[];
  subTotal?: number;
  taxableAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
}

interface InvoiceType {
  sender?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    trn?: string;
  };
  receiver?: Receiver;
  details?: Details;
}

export async function generatePdfService(body: InvoiceType): Promise<Buffer> {
  await connectToDatabase();

  console.log("Input body:", JSON.stringify(body, null, 2));

  if (!body.details?.invoiceNumber) {
    throw new Error("Invoice number is missing");
  }

  const senderData = body.sender || {
    name: "Green Grass And Carpet LLC",
    address: "Shop No. 201, Najmiya Ajman",
    phone: "+971 56 879 8791",
    email: "shop.greengrassandcarpet@gmail.com",
    trn: "TRN-100287600003",
  };
  const receiver = body.receiver || { name: "Mohammed Iqbal", phone: "+971543729292" };
  const details = body.details || {};

  const DATE_OPTIONS = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  } as const;

  const formatNumberWithCommas = (num: number): string =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const itemsHtml = (details.items || [])
    .map((item: Item, index: number) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const taxable = item.taxable || 0;
      const taxPercent = item.taxPercent || 0;
      const total = item.total || (quantity * unitPrice);

      return `
        <tr>
          <td class="p-2 text-center">${index + 1}</td>
          <td class="p-2 text-center">${item.name || ""}</td>
          <td class="p-2 text-center">${quantity}</td>
          <td class="p-2 text-center">${unitPrice ? `${formatNumberWithCommas(unitPrice)} AED` : "0 AED"}</td>
          <td class="p-2 text-center">${taxable ? `${formatNumberWithCommas(taxable)} AED` : "0 AED"}</td>
          <td class="p-2 text-center">${taxPercent ? `${taxPercent}%` : "0%"}</td>
          <td class="p-2 text-center">${total ? `${formatNumberWithCommas(total)} AED` : "0 AED"}</td>
        </tr>
      `;
    })
    .join("");

  const logoPath = path.resolve(process.cwd(), "public/assets/img/your-logo.jpg");
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

  const htmlTemplate = `
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
      ${tailwindCss}
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 0;
        background-color: #fff;
      }
      .container {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #4CAF50;
        color: white;
        text-align: center;
        padding: 10px;
        margin-bottom: 20px;
      }
      .header img {
        max-height: 50px;
      }
      .header p {
        margin: 5px 0;
      }
      .invoice-details {
        text-align: center;
        margin-bottom: 20px;
      }
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      .invoice-table th, .invoice-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: center;
      }
      .invoice-table th {
        background-color: #f2f2f2;
      }
      .summary {
        text-align: right;
        margin-bottom: 20px;
      }
      .summary p {
        margin: 5px 0;
      }
      .footer {
        text-align: center;
        border-top: 1px solid #ddd;
        padding-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="${logoBase64}" alt="${senderData.name} Logo" />
        <p>${senderData.name}</p>
        <p>${senderData.address}</p>
        <p>${senderData.phone} | ${senderData.email}</p>
        <p>TRN: ${senderData.trn}</p>
      </div>
      <div class="invoice-details">
        <h2>TAX INVOICE</h2>
        <p>Invoice #: ${details.invoiceNumber || "INV-27419"}</p>
        <p>Invoice Date: ${new Date(details.invoiceDate || "29-08-2024").toLocaleDateString("en-US", DATE_OPTIONS)}</p>
        <p>Billed To: ${receiver.name}</p>
        <p>Phone: ${receiver.phone || ""}</p>
      </div>
      <table class="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Taxable</th>
            <th>Tax %</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="summary">
        <p>Sub Total: ${formatNumberWithCommas(Number(details.subTotal || 0))} AED</p>
        <p>Taxable Amount: ${formatNumberWithCommas(Number(details.taxableAmount || 0))} AED</p>
        <p>Tax %: ${formatNumberWithCommas(Number(details.taxAmount || 0))} AED</p>
        <p>Grand Total: ${formatNumberWithCommas(Number(details.totalAmount || 0))} AED</p>
      </div>
      <div class="footer">
        <p>Payment Instructions</p>
        <p>Raqeeq Bank and Carpet LLC</p>
        <p>Account Number: 0000000000000001</p>
        <p>Terms & Condition</p>
        <p>100% Advance Payment</p>
        <p>For, ${senderData.name}</p>
        <p>AUTHORIZED SIGNATURE: _________________</p>
      </div>
    </div>
  </body>
</html>
  `;

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

    console.log("Chromium executable path:", launchOptions.executablePath);

    browser = await puppeteerCore.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(htmlTemplate, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const pdfBuffer: any = await page.pdf({
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
