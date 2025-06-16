"use client";

import React from "react";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { BaseButton } from "@/app/components";
import { ArrowLeft, ArrowRight, FileInput } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { InvoiceType } from "@/types";

const WizardNavigation = () => {
  const { currentWizardStep, setCurrentWizardStep, invoicePdfLoading, onFormSubmit } = useInvoiceContext();
  const { _t } = useTranslationContext();
  const { handleSubmit } = useFormContext<InvoiceType>();

  const isFirstStep = currentWizardStep === 0;
  const isLastStep = currentWizardStep === 3;

  const previousStep = () => {
    if (!isFirstStep) {
      setCurrentWizardStep(currentWizardStep - 1);
    }
  };

  const nextStep = () => {
    if (!isLastStep) {
      setCurrentWizardStep(currentWizardStep + 1);
    }
  };

  // Create a submit handler that will only be called when the button is clicked
  const handleGeneratePdf = handleSubmit(onFormSubmit);

  return (
    <div className="flex justify-end gap-5">
      {!isFirstStep && (
        <BaseButton
          tooltipLabel="Go back to the previous step"
          onClick={previousStep}
        >
          <ArrowLeft />
          {_t("form.wizard.back")}
        </BaseButton>
      )}
      {isLastStep ? (
        <BaseButton
          type="button"
          tooltipLabel="Generate your invoice"
          loading={invoicePdfLoading}
          loadingText="Generating your invoice"
          onClick={(e) => {
            e.preventDefault(); // Prevent default form submission
            handleGeneratePdf();
          }}
        >
          <FileInput />
          {_t("actions.generatePdf")}
        </BaseButton>
      ) : (
        <BaseButton
          tooltipLabel="Go to the next step"
          disabled={isLastStep}
          onClick={nextStep}
        >
          {_t("form.wizard.next")}
          <ArrowRight />
        </BaseButton>
      )}
    </div>
  );
};

export default WizardNavigation;