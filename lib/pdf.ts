// lib/pdfUtils.ts
import { getInvoiceTemplate } from "@/lib/helpers";
import { InvoiceType } from "@/types";

export const renderInvoiceTemplate = async (body: InvoiceType) => {
  try {
    const templateId = body.details.pdfTemplate;
    const InvoiceTemplate = await getInvoiceTemplate(templateId);
    if (!InvoiceTemplate) {
      throw new Error(`No template found for ID ${templateId}`);
    }

    const ReactDOMServer = (await import("react-dom/server")).default;
    const htmlTemplate = ReactDOMServer.renderToStaticMarkup(InvoiceTemplate({ ...body }));
    return htmlTemplate;
  } catch (error: any) {
    throw error;
  }
};