import { NextRequest, NextResponse } from "next/server";
import { generatePdfService } from "@/services/invoice/server/generatePdfService";
import { InvoiceType } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: InvoiceType = await req.json();

    // Coerce pdfTemplate to number if needed
    if (typeof body.details.pdfTemplate === "string") {
      body.details.pdfTemplate = Number(body.details.pdfTemplate);
    }

    // Validate required fields
    if (!body.details?.invoiceNumber) {
      return new NextResponse(JSON.stringify({ error: "Invoice number is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (typeof body.details?.pdfTemplate !== "number") {
      return new NextResponse(JSON.stringify({ error: "PDF template must be a number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pdfBuffer = await generatePdfService(body as any);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      return new NextResponse(JSON.stringify({ error: "Failed to generate PDF" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return the PDF as a downloadable file
    return new NextResponse(new Blob([pdfBuffer], { type: "application/pdf" }), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice_${body.details.invoiceNumber}.pdf`,
        "Cache-Control": "no-cache",
      },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error.message);
    return new NextResponse(JSON.stringify({ error: "Failed to generate PDF", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}