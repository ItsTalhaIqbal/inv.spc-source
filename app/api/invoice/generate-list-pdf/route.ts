import { NextRequest, NextResponse } from "next/server";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

interface InvoiceItem {
  _id?: string;
  receiver: { name: string; phone: string };
  details: {
    invoiceNumber: string;
    invoiceDate: string;
    subTotal: number;
    totalAmount: number;
    taxDetails?: { amount: number };
    isInvoice: boolean;
  };
  createdAt?: string;
}

const generateListHtml = (invoices: InvoiceItem[]) => {
  const rows = invoices
    .map((inv, index) => {
      const tax = Number(inv.details.taxDetails?.amount || 0);
      const date = new Date(inv.details.invoiceDate).toLocaleDateString(
        "en-GB"
      );

      return `
        <tr class="${
          index % 2 === 0 ? "bg-gray-50" : "bg-white"
        } hover:bg-blue-50 transition-colors">
          <td class="py-4 px-6 text-center font-medium text-gray-700">${
            index + 1
          }</td>
          <td class="py-4 px-6 text-center">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              inv.details.isInvoice
                ? tax > 0
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }">
              ${inv.details.isInvoice ? "INV" : "QUT"}
            </span>
            <span class="ml-2 font-bold text-gray-900">${
              inv.details.invoiceNumber
            }</span>
          </td>
          <td class="py-4 px-6 font-semibold text-gray-800">${
            inv.receiver.name || "N/A"
          }</td>
          <td class="py-4 px-6 text-gray-600">${
            inv.receiver.phone || "N/A"
          }</td>
          <td class="py-4 px-6 text-center text-gray-700">${date}</td>
          <td class="py-4 px-6 text-right text-gray-700 font-medium">${Number(
            inv.details.subTotal
          ).toFixed(2)}</td>
          <td class="py-4 px-6 text-right ${
            tax > 0 ? "text-red-600 font-bold" : "text-gray-500"
          }">
            ${tax.toFixed(2)}
          </td>
          <td class="py-4 px-6 text-right text-xl font-bold text-blue-700">
            ${Number(inv.details.totalAmount).toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  const totals = invoices.reduce(
    (acc, inv) => {
      acc.sub += inv.details.subTotal;
      acc.vat += Number(inv.details.taxDetails?.amount || 0);
      acc.grand += inv.details.totalAmount;
      return acc;
    },
    { sub: 0, vat: 0, grand: 0 }
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SPC Source - Documents Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #2d3748;
    }
    .container {
      max-width: 1200px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: #FFA733;
    }
    .logo h1 {
      font-size: 32px;
      font-weight: 800;
      margin: 0;
      letter-spacing: 1px;
    }
    .logo p {
      margin: 8px 0 0;
      font-size: 18px;
      opacity: 0.9;
    }
    .meta-info {
      background: #f8fafc;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      color: #4a5568;
    }
    .meta-info strong { color: #2d3748; font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
    }
    th {
      background: #1e293b;
      color: white;
      padding: 18px 12px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 16px 12px;
      text-align: center;
    }
    .total-row {
      background: #fef3c7 !important;
      font-weight: 800;
      font-size: 18px;
    }
    .total-row td {
      padding: 20px 12px;
      color: #92400e;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: #1e293b;
      color: white;
      margin-top: 40px;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
    }
    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 11px;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <h1>SPC Source Technical Services LLC</h1>
        <p>Professional Documents Summary Report</p>
      </div>
    </div>

    <div class="meta-info">
      <div>
        <p><strong>Generated on:</strong> ${new Date().toLocaleString(
          "en-GB"
        )}</p>
        <p><strong>Report Type:</strong> Filtered Documents List</p>
      </div>
      <div style="text-align:right">
        <p><strong>Total Documents:</strong> <span style="font-size:20px; color:#1e40af">${
          invoices.length
        }</span></p>
        <p><strong>Filtered Results:</strong> Showing current view</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr.</th>
          <th>Document No.</th>
          <th>Customer Name</th>
          <th>Phone</th>
          <th>Date</th>
          <th>Sub Total</th>
          <th>VAT</th>
          <th>Grand Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="5"><strong>TOTAL (${
            invoices.length
          } Documents)</strong></td>
          <td><strong>AED ${totals.sub.toFixed(2)}</strong></td>
          <td><strong>AED ${totals.vat.toFixed(2)}</strong></td>
          <td><strong>AED ${totals.grand.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p style="font-size:16px; margin:0">SPC Source Technical Services LLC</p>
      <p>Iris Bay, Office D-43, Business Bay, Dubai, UAE</p>
      <p>+971 54 500 4520 | contact@spcsource.com | www.spcsource.com</p>
      <p style="margin-top:12px; opacity:0.8">© 2025 All Rights Reserved</p>
    </div>
  </div>
</body>
</html>
  `;
};

export async function POST(req: NextRequest) {
  let browser = null;
  try {
    const { invoices } = await req.json();

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    const html = generateListHtml(invoices);

    const launchOptions = {
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
      ),
      headless: true,
    };

    browser = await puppeteerCore.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return new NextResponse(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=SPC_Documents_List_${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`,
      },
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}
