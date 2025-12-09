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
      const tax = Number(inv.details.taxDetails?.amount || 0).toFixed(2);
      const date = new Date(inv.details.invoiceDate).toLocaleDateString(
        "en-GB"
      );

      return `
        <tr class="border-b">
          <td class="py-3 px-4 text-center">${index + 1}</td>
          <td class="py-3 px-4 text-center font-medium">
            ${inv.details.isInvoice ? "INV" : "QUT"}-${
        inv.details.invoiceNumber
      }
          </td>
          <td class="py-3 px-4">${inv.receiver.name || "N/A"}</td>
          <td class="py-3 px-4">${inv.receiver.phone || "N/A"}</td>
          <td class="py-3 px-4 text-center">${date}</td>
          <td class="py-3 px-4 text-right">${Number(
            inv.details.subTotal
          ).toFixed(2)}</td>
          <td class="py-3 px-4 text-right font-medium">${tax}</td>
          <td class="py-3 px-4 text-right font-bold text-lg">${Number(
            inv.details.totalAmount
          ).toFixed(2)}</td>
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
<html>
<head>
  <meta charset="UTF-8">
  <title>Documents List - SPC Source</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #FFA733; }
    .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
    .header p { color: #7f8c8d; margin: 10px 0 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #34495e; color: white; padding: 15px; text-align: center; font-weight: 600; }
    td { padding: 12px 8px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f1f8ff; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer { margin-top: 40px; text-align: center; font-size: 14px; color: #95a5a6; }
    .total-row { background: #ecf0f1; font-weight: bold; font-size: 18px; }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo img { height: 80px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>SPC Source Technical Services LLC</h1>
      <p>Documents Summary Report</p>
      <p>Generated on: ${new Date().toLocaleString("en-GB")}</p>
      <p>Total Documents: ${invoices.length}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr.</th>
          <th>INV#</th>
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
          <td colspan="5" class="text-center font-bold">TOTAL</td>
          <td class="text-right">${totals.sub.toFixed(2)}</td>
          <td class="text-right">${totals.vat.toFixed(2)}</td>
          <td class="text-right">${totals.grand.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>© 2025 SPC Source Technical Services LLC | All rights reserved</p>
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
