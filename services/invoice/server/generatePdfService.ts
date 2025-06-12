import { InvoiceType } from "@/types";
import { TAILWIND_CDN } from "@/lib/variables";
import { connectToDatabase } from "@/lib/mongoose";
import fs from "fs";
import path from "path";

export async function generatePdfService(body: InvoiceType): Promise<Buffer> {
  let browser;
  let page;

  try {
    await connectToDatabase();

    if (!body.details?.invoiceNumber) {
      throw new Error("Invoice number is missing");
    }
    if (typeof body.details?.pdfTemplate !== "number") {
      throw new Error(
        `PDF template must be a number, received: ${body.details.pdfTemplate}`
      );
    }
    const senderData = body.sender || {};
    const receiver = body.receiver || {};
    const details = body.details || {};

    const DATE_OPTIONS = {
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
    } as const;

    const formatNumberWithCommas = (num: number) =>
      num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

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

    const logoPath = path.resolve(process.cwd(), "public/assets/img/image.jpg");
    let logoBase64: string;
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      logoBase64 = "";
    }

    let tailwindCss: string;
    try {
      const response = await fetch(TAILWIND_CDN);
      tailwindCss = await response.text();
    } catch (error) {
      tailwindCss = "";
    }

    const taxDetails = details.taxDetails || { amount: 0, amountType: "amount" };
    const discountDetails = details.discountDetails || { amount: 0, amountType: "amount" };
    const shippingDetails = details.shippingDetails || { cost: 0, costType: "amount" };

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
              padding: 20px;
              height: 100vh;
              box-sizing: border-box;
              position: relative;
              min-height: 842px;
            }
            .text-right { text-align: right; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: -10px;
            }
            .logo {
              margin: 0;
              padding: 0;
              line-height: 0;
            }
            .invoice-details {
              margin: 0;
              padding: 0;
              text-align: right;
              margin-top: 20px;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
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
              color: #000;
              font-size: 14px;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .footer {
              position: absolute;
              bottom: 40px;
              width: calc(100% - 40px);
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .footer-bar {
              background-color: #fb923c;
              color: black;
              padding: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <img src="${logoBase64}" width="140" height="100" alt="SPC Source Logo" style="vertical-align: top;" />
            </div>
            <div class="invoice-details">
              <p class="text-base text-gray-800">${senderData.phone || ""}</p>
              <p class="text-base text-gray-800">${senderData.address || ""}</p>
              <h2 class="text-xl font-bold text-gray-800 mt-2">${details.invoiceNumber.includes("INV") ? "INVOICE# " : "QUOATION# "} <span class="text-lg text-gray-600 font-thin">${
                details.invoiceNumber || ""
              }</span> </h2>
              <p class="text-base text-gray-800">${new Date(
                details.invoiceDate || new Date()
              ).toLocaleDateString("en-US", DATE_OPTIONS)}</p>
            </div>
          </div>

          <div class="mt-6">
            <h3 class="text-base font-bold text-gray-800">CUSTOMER INFO</h3>
            <h3 class="text-xl text-gray-800">${receiver.name || ""}</h3>
            <h3 class="text-lg text-gray-800">${receiver.address || ""}</h3>
          </div>

          <div class="mt-4">
            <h3 class="text-base font-bold text-gray-800">ITEMS</h3>
            <table class="invoice-table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sr.</th>
                  <th style="width: 50%;">Product</th>
                  <th style="width: 15%;">Qty</th>
                  <th style="width: 15%;">Unit Price</th>
                  <th style="width: 15%;">Amount (AED)</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <p class="text-base text-gray-800">Received above items in good condition</p>
            <div class="text-right">
              ${taxHtml}
              ${discountHtml}
              ${shippingHtml}
              <p class="text-base font-bold text-gray-800">Total ${formatNumberWithCommas(
                Number(details.totalAmount || 0)
              )} AED</p>
            </div>
          </div>

          <div class="footer">
            <div class="flex justify-between">
              <p class="text-base font-bold text-gray-800">Receiver's Sign _________________</p>
              <p class="text-base font-bold text-gray-800">for ${
                senderData.name || ""
              }</p>
            </div>
            <div class="footer-bar">
              <div class="flex items-center">
                <span class="mr-2 text-base">📧</span>
                <span class="text-base">${senderData.email || ""}</span>
              </div>
              <div class="flex items-center">
                <span class="mr-2 text-base">🌐</span>
                <span class="text-base">www.spcsource.com</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const puppeteer = await import("puppeteer");
    let browserAttempts = 0;
    const maxBrowserAttempts = 3;
    while (browserAttempts < maxBrowserAttempts) {
      try {
        browser = await puppeteer.launch({
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
          headless: true,
        });
        if (!browser) throw new Error("Failed to launch browser");
        break;
      } catch (error) {
        browserAttempts++;
        if (browserAttempts === maxBrowserAttempts) {
          throw new Error(
            `Failed to launch browser after ${maxBrowserAttempts} attempts`
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * browserAttempts)
        );
      }
    }

    page = await browser?.newPage();
    await page?.setContent(htmlTemplate, {
      waitUntil: ["networkidle0", "load", "domcontentloaded"],
      timeout: 60000,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await page?.screenshot({ path: "debug-screenshot.png", fullPage: true });

    const pdf: any = await page?.pdf({
      format: "a4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    });

    return pdf;
  } catch (error: any) {
    throw error;
  } finally {
    if (page) await page.close();
    if (browser) {
      const pages = await browser.pages();
      await Promise.all(pages.map((p) => p.close()));
      await browser.close();
    }
  }
}

function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}