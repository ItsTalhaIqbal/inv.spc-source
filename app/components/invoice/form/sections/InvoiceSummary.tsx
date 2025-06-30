"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Charges, FormTextarea, SignatureModal, Subheading } from "@/app/components";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { SignatureContextProvider } from "@/contexts/SignatureContext";
import { InvoiceType } from "@/types";

const InvoiceSummary = () => {
  const { _t } = useTranslationContext();
  const { setValue } = useFormContext<InvoiceType>();

  useEffect(() => {
    setValue("details.additionalNotes", "Received above items in good condition.");
    setValue("details.paymentTerms", "50% advance upon confirmation of the order, 50% upon delivery or completion.");
  }, [setValue]);

  return (
    <section>
      <Subheading>{_t("form.steps.summary.heading")}:</Subheading>
      <div className="flex flex-wrap gap-x-5 gap-y-10">
        <div className="flex flex-col gap-3">
          <SignatureContextProvider>
            <SignatureModal />
          </SignatureContextProvider>

          <FormTextarea
            name="details.additionalNotes"
            label={_t("form.steps.summary.additionalNotes")}
            placeholder="Your additional notes"
            
          />
          <FormTextarea
            name="details.paymentTerms"
            label={_t("form.steps.summary.paymentTerms")}
            placeholder="Ex: Net 30"
          />

          <Charges />
        </div>
      </div>
    </section>
  );
};

export default InvoiceSummary;