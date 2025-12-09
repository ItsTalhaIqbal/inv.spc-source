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
      // Calculate actual VAT amount (5% of subtotal if tax applied)
      const taxRate = inv.details.taxDetails?.amount || 0;
      const calculatedVat =
        taxRate > 0
          ? Number(((inv.details.subTotal * taxRate) / 100).toFixed(2))
          : 0;

      const date = new Date(inv.details.invoiceDate).toLocaleDateString(
        "en-GB"
      );

      return `
        <tr class="${
          index % 2 === 0 ? "bg-white" : "bg-gray-50"
        } hover:bg-blue-50 transition-all">
          <td class="py-5 px-6 text-center font-bold text-gray-800 text-lg">${
            index + 1
          }</td>
          <td class="py-5 px-6 text-center">
            <div class="flex items-center justify-center gap-3">
              <span class="inline-block px-4 py-2 rounded-full text-sm font-bold text-white ${
                inv.details.isInvoice
                  ? calculatedVat > 0
                    ? "bg-red-600"
                    : "bg-blue-600"
                  : "bg-green-600"
              }">
                ${inv.details.isInvoice ? "INV" : "QUT"}
              </span>
              <span class="font-bold text-xl text-gray-900">${
                inv.details.invoiceNumber
              }</span>
            </div>
          </td>
          <td class="py-5 px-6 font-semibold text-gray-800 text-lg">${
            inv.receiver.name || "N/A"
          }</td>
          <td class="py-5 px-6 text-gray-700 text-lg">${
            inv.receiver.phone || "N/A"
          }</td>
          <td class="py-5 px-6 text-center text-gray-700 text-lg font-medium">${date}</td>
          <td class="py-5 px-6 text-right text-gray-800 text-lg font-semibold">${inv.details.subTotal.toFixed(
            2
          )}</td>
          <td class="py-5 px-6 text-right text-lg font-bold ${
            calculatedVat > 0 ? "text-red-600" : "text-gray-500"
          }">
            ${calculatedVat.toFixed(2)}
          </td>
          <td class="py-5 px-6 text-right text-2xl font-extrabold text-blue-700">
            ${inv.details.totalAmount.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  // Calculate totals
  const totals = invoices.reduce(
    (acc, inv) => {
      const taxRate = inv.details.taxDetails?.amount || 0;
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
<html lang="en">
<head>
  <meta charset="UTF-8" />
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <title>SPC Source - Documents Report</title>
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
 <style>
   * { box-sizing: border-box; }
   body {
     font-family: 'Inter', sans-serif;
     margin: 0;
     padding: 0;
     background: linear-gradient(135deg, #1e3a8a, #3b82f6);
     min-height: 100vh;
   }
   .container {
     max-width: 1300px;
     margin: 30px auto;
     background: white;
     border-radius: 20px;
     overflow: hidden;
     box-shadow: 0 25px 60px rgba(0,0,0,0.3);
   }
   .header {
     background: linear-gradient(90deg, #1e40af, #2563eb);
     color: white;
     padding: 35px 40px;
     text-align: center;
   }
   .header h1 {
     font-size: 36px;
     font-weight: 900;
     margin: 0;
     letter-spacing: 1.5px;
   }
   .header p {
     font-size: 20px;
     margin: 10px 0 0;
     opacity: 0.95;
   }
   .meta {
     display: flex;
     justify-content: space-between;
     padding: 25px 40px;
     background: #f8fafc;
     border-bottom: 1px solid #e2e8f0;
     font-size: 16px;
   }
   .meta div strong { color: #1e40af; font-weight: 700; }
   table {
     width: 100%;
     border-collapse: collapse;
   }
   th {
     background: #1e293b;
     color: white;
     padding: 20px 15px;
     font-weight: 800;
     font-size: 15px;
     text-transform: uppercase;
     letter-spacing: 1px;
   }
   td {
     padding: 18px 15px;
     border-bottom: 1px solid #e2e8f0;
   }
   .total-row {
     background: #fff7ed !important;
   }
   .total-row td {
     padding: 30px 15px;
     font-size: 20px;
     font-weight: 900;
     color: #9a3412;
   }
   .total-label {
     text-align: left !important;
     padding-left: 40px !important;
   }
   .footer {
     background: #1e293b;
     color: white;
     text-align: center;
     padding: 30px;
     font-size: 15px;
   }
   .footer p { margin: 8px 0; }
   @media print {
     body { background: white; }
     .container { box-shadow: none; margin: 0; border-radius: 0; }
   }
 </style>
</head>
<body>
 <div class="container">
   <div class="meta">
     <div>
       <p><strong>Generated on:</strong> ${new Date().toLocaleString(
         "en-GB"
       )}</p>
       <p><strong>Report Type:</strong> Filtered Documents List</p>
     </div>
     <div style="text-align:right">
       <p><strong>Total Documents:</strong> <span style="font-size:28px; font-weight:900; color:#dc2626">${
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
         <td colspan="5" class="total-label"><strong>TOTAL (${
           invoices.length
         } Documents)</strong></td>
         <td class="text-right"><strong>AED ${totals.sub.toFixed(
           2
         )}</strong></td>
         <td class="text-right"><strong>AED ${totals.vat.toFixed(
           2
         )}</strong></td>
         <td class="text-right text-3xl"><strong>AED ${totals.grand.toFixed(
           2
         )}</strong></td>
       </tr>
     </tbody>
   </table>
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
