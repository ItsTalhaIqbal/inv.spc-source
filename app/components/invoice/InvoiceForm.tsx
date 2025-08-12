"use client";

import { useEffect, useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// ShadCn
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// React Wizard
import { Wizard } from "react-use-wizard";

// Components
import {
  WizardStep,
  BillFromSection,
  BillToSection,
  InvoiceDetails,
  Items,
  PaymentInformation,
  InvoiceSummary,
  BaseButton,
  NewInvoiceAlert,
} from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { Plus } from "lucide-react";
import { useInvoiceContext } from "@/contexts/InvoiceContext";

const InvoiceForm = () => {
  const { _t } = useTranslationContext();
  const { control } = useFormContext();
  const { invoicePdfLoading, downloadPdf } = useInvoiceContext();

  // Watch invoice number and tax details
  const invoiceNumber = useWatch({
    name: "details.invoiceNumber",
    control,
  });
  const taxAmount = useWatch({
    name: "details.taxDetails.amount",
    control,
  });

  // Determine document type
  const isTaxInvoice = taxAmount && taxAmount > 0;
  const isQuotation = !isTaxInvoice;

  // Auto-download PDF when generation is complete
  useEffect(() => {
    if (!invoicePdfLoading && invoicePdfLoading !== undefined && invoiceNumber) {
      downloadPdf(invoiceNumber,);
    }
  }, [invoicePdfLoading, invoiceNumber, downloadPdf]);

  const invoiceNumberLabel = useMemo(() => {
    if (invoiceNumber) {
      return `#${invoiceNumber}`;
    } else {
      return _t("form.newInvBadge");
    }
  }, [invoiceNumber, _t]);

  return (
    <div className="xl:w-[55%]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CardTitle className="uppercase">{_t("form.title")}</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  <p style={{ fontSize: "14px" }}>{invoiceNumberLabel}</p>
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {/* New invoice button */}
                <NewInvoiceAlert>
                  <BaseButton
                    variant="outline"
                    tooltipLabel="Get a new invoice form"
                    disabled={invoicePdfLoading}
                  >
                    <Plus />
                    {_t("actions.newInvoice")}
                  </BaseButton>
                </NewInvoiceAlert>
              </div>
            </div>
            <CardDescription>{_t("form.description")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <Wizard>
              <WizardStep>
                <div className="flex gap-x-20 gap-y-10">
                  {/* <BillFromSection /> */}
                  <BillToSection />
                </div>
                <div className="flex flex-wrap gap-y-10">
                  <InvoiceDetails />
                </div>
                <Items />
                <InvoiceSummary />
              </WizardStep>
            </Wizard>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceForm;