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
      const taxRate = Number(inv.details.taxDetails?.amount || 0);
      const vatAmount =
        taxRate > 0
          ? Number(((inv.details.subTotal * taxRate) / 100).toFixed(2))
          : 0;
      const date = new Date(inv.details.invoiceDate).toLocaleDateString(
        "en-GB"
      );

      return `
        <tr style="height: 48px; ${
          index % 2 === 0 ? "background:#f8fafc;" : "background:white;"
        }">
          <td style="padding:8px 12px; text-align:center; font-weight:600; font-size:14px; color:#000;">${
            index + 1
          }</td>
          <td style="padding:8px 12px; text-align:center;">
            <span style="display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:bold; color:white; ${
              inv.details.isInvoice
                ? vatAmount > 0
                  ? "background:#dc2626;"
                  : "background:#2563eb;"
                : "background:#16a34a;"
            }">
              ${inv.details.isInvoice ? "INV" : "QUT"}
            </span>
            <span style="margin-left:8px; font-weight:bold; font-size:15px; color:#000;">${
              inv.details.invoiceNumber
            }</span>
          </td>
          <td style="padding:8px 12px; font-weight:600; font-size:14px; color:#000;">${
            inv.receiver.name || "N/A"
          }</td>
          <td style="padding:8px 12px; font-size:14px; color:#000;">${
            inv.receiver.phone || "N/A"
          }</td>
          <td style="padding:8px 12px; text-align:center; font-size:14px; color:#000;">${date}</td>
          <td style="padding:8px 12px; text-align:right; font-weight:600; font-size:14px; color:#000;">${inv.details.subTotal.toFixed(
            2
          )}</td>
          <td style="padding:8px 12px; text-align:right; font-weight:bold; font-size:15px; color:#000;">${vatAmount.toFixed(
            2
          )}</td>
          <td style="padding:8px 12px; text-align:right; font-weight:900; font-size:17px; color:#000;">${inv.details.totalAmount.toFixed(
            2
          )}</td>
        </tr>
      `;
    })
    .join("");

  const totals = invoices.reduce(
    (acc, inv) => {
      const taxRate = Number(inv.details.taxDetails?.amount || 0);
      const vat = taxRate > 0 ? (inv.details.subTotal * taxRate) / 100 : 0;
      acc.sub += inv.details.subTotal;
      acc.vat += vat;
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
  <title>SPC Source - Documents Report</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin:0; padding:15px; background:#f1f5f9; }
    .container { width:100%; max-width:1300px; margin:0 auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
    .header { background:#1e40af; color:white; padding:20px; text-align:center; }
    .header h1 { margin:0; font-size:28px; font-weight:800; }
    .header p { margin:8px 0 0; font-size:16px; opacity:0.9; }
    .meta { display:flex; justify-content:space-between; padding:15px 25px; background:#f8fafc; font-size:14px; }
    .meta strong { color:#1e40af; }
    table { width:100%; border-collapse:collapse; }
    th { background:#1e293b; color:white; padding:12px 10px; text-align:center; font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing:0.5px; }
    td { padding:8px 12px; border-bottom:1px solid #e2e8f0; }
    .total-row { background:#fff7ed !important; }
    .total-row td { padding:18px 12px; font-size:18px; font-weight:900; }
    .footer { background:#1e293b; color:white; text-align:center; padding:20px; font-size:13px; }
    @page { size: A4 landscape; margin:10mm; }
    @media print { body { padding:0; } .container { box-shadow:none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SPC Source Technical Services LLC</h1>
      <p>Professional Documents Summary Report</p>
    </div>

    <div class="meta">
      <div>
        <p><strong>Generated on:</strong> ${new Date().toLocaleDateString(
          "en-GB"
        )} ${new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}</p>
        <p><strong>Report Type:</strong> Filtered Documents List</p>
      </div>
      <div style="text-align:right">
        <p><strong>Total Documents:</strong> <span style="font-size:24px; font-weight:900; color:#dc2626">${
          invoices.length
        }</span></p>
        <p><strong>Filtered Results:</strong> Showing current view</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Sr.</th>
          <th>DOCUMENT NO.</th>
          <th>CUSTOMER NAME</th>
          <th>PHONE</th>
          <th>DATE</th>
          <th>SUB TOTAL</th>
          <th>VAT</th>
          <th>GRAND TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="5" style="text-align:left; padding-left:30px; font-size:18px;"><strong>TOTAL (${
            invoices.length
          } Documents)</strong></td>
          <td style="text-align:right; font-size:19px;"><strong>AED ${totals.sub.toFixed(
            2
          )}</strong></td>
          <td style="text-align:right; font-size:19px;"><strong>AED ${totals.vat.toFixed(
            2
          )}</strong></td>
          <td style="text-align:right; font-size:22px;"><strong>AED ${totals.grand.toFixed(
            2
          )}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p style="margin:0; font-weight:700;">SPC Source Technical Services LLC</p>
      <p style="margin:5px 0;">Iris Bay, Office D-43, Business Bay, Dubai, UAE</p>
      <p style="margin:5px 0;">+971 54 500 4520 | contact@spcsource.com</p>
      <p style="margin-top:10px; opacity:0.8;">© 2025 All Rights Reserved</p>
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
