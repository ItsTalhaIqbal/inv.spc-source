"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { BaseButton } from "@/app/components";
import { InvoiceType, WizardStepType } from "@/types";
import { useInvoiceContext } from "@/contexts/InvoiceContext"; // Import InvoiceContext

type WizardProgressProps = {
  // Removed wizard prop since we're using context
};

const WizardProgress = ({}: WizardProgressProps) => {
  const { currentWizardStep, setCurrentWizardStep } = useInvoiceContext(); // Use context
  const {
    formState: { errors },
  } = useFormContext<InvoiceType>();
  const { _t } = useTranslationContext();

  const step1Valid = !errors.sender && !errors.receiver;
  const step2Valid =
    !errors.details?.invoiceNumber &&
    !errors.details?.dueDate &&
    !errors.details?.invoiceDate &&
    !errors.details?.currency;
  const step3Valid = !errors.details?.items;
  const step4Valid =
    !errors.details?.paymentTerms &&
    !errors.details?.subTotal &&
    !errors.details?.totalAmount &&
    !errors.details?.discountDetails?.amount &&
    !errors.details?.taxDetails?.amount &&
    !errors.details?.shippingDetails?.cost;

  const returnButtonVariant = (step: WizardStepType) => {
    if (!step.isValid) {
      return "destructive";
    }
    if (step.id === currentWizardStep) {
      return "default";
    } else {
      return "outline";
    }
  };

  const stepPassed = (currentStep: WizardStepType) => {
    if (currentStep.isValid) {
      return currentWizardStep > currentStep.id ? true : false;
    }
  };

  const steps: WizardStepType[] = [
    {
      id: 0,
      label: _t("form.wizard.fromAndTo"),
      isValid: step1Valid,
    },
    {
      id: 1,
      label: _t("form.wizard.invoiceDetails"),
      isValid: step2Valid,
    },
    {
      id: 2,
      label: _t("form.wizard.lineItems"),
      isValid: step3Valid,
    },
    {
      id: 3,
      label: _t("form.wizard.summary"),
      isValid: step4Valid,
    },
  ];

  return (
    <div className="flex flex-wrap justify-around items-center gap-y-3">
      {steps.map((step) => (
        <div key={step.id} className="flex items-center">
          <BaseButton
            variant={returnButtonVariant(step)}
            className="w-auto"
            onClick={() => {
              setCurrentWizardStep(step.id); // Update step via context
            }}
          >
            {step.id + 1}. {step.label}
          </BaseButton>
        </div>
      ))}
    </div>
  );
};

export default WizardProgress;