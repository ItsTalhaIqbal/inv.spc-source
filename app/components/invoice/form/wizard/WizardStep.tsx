"use client";

import React from "react";
import { WizardNavigation, WizardProgress } from "@/app/components";
import { useInvoiceContext } from "@/contexts/InvoiceContext"; // Import InvoiceContext

type WizardStepProps = {
  children: React.ReactNode[];
};

const WizardStep = ({ children }: WizardStepProps) => {
  const { currentWizardStep } = useInvoiceContext(); // Use context

  return (
    <div className="min-h-[25rem]">
      <WizardProgress />
      <div className="my-7">{children[currentWizardStep]}</div>
      <WizardNavigation />
    </div>
  );
};

export default WizardStep;