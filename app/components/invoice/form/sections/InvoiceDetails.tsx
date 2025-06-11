"use client";

import { useState, useEffect } from "react";
import {
  CurrencySelector,
  DatePickerFormField,
  FormInput,
  FormFile,
  Subheading,
  TemplateSelector,
} from "@/app/components";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useFormContext } from "react-hook-form";
import { Switch } from "@/components/ui/switch";

const InvoiceDetails = () => {
  const { _t } = useTranslationContext();
  const { setValue, getValues, watch } = useFormContext();
  const [loading, setLoading] = useState(true);
  const [invoiceNum, setInvoiceNum] = useState("");

  const isInvoice = watch("details.isInvoice"); // Watch the form value

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      try {
        const response = await fetch("/api/invoice/next-number");
        const data = await response.json();
        if (response.ok && data.invoiceNumber) {
          let invoiceNumber = data.invoiceNumber;
          const isInvoiceValue = invoiceNumber.startsWith("INV");
          setValue("details.isInvoice", isInvoiceValue, { shouldValidate: true });
          setValue("details.invoiceNumber", invoiceNumber, { shouldValidate: true });
          setInvoiceNum(invoiceNumber);
        } else {
          const fallback = `INV-${Date.now()}`;
          setValue("details.isInvoice", true, { shouldValidate: true });
          setValue("details.invoiceNumber", fallback, { shouldValidate: true });
          setInvoiceNum(fallback);
        }
      } catch (error) {
        const fallback = `INV-${Date.now()}`;
        setValue("details.isInvoice", true, { shouldValidate: true });
        setValue("details.invoiceNumber", fallback, { shouldValidate: true });
        setInvoiceNum(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoiceNumber();
  }, [setValue]);

  const handleSwitchChange = (checked:any) => {
    setValue("details.isInvoice", checked, { shouldValidate: true });
    if (invoiceNum) {
      const newInvoiceNum = checked
        ? invoiceNum.replace(/^QUOT/, "INV")
        : invoiceNum.replace(/^INV/, "QUOT");
      setValue("details.invoiceNumber", newInvoiceNum, { shouldValidate: true });
      setInvoiceNum(newInvoiceNum);
    }
  };

  return (
    <section className="flex flex-col flex-wrap gap-5">
      <Subheading>{_t("form.steps.invoiceDetails.heading")}:</Subheading>
      <div className="flex flex-row flex-wrap gap-5">
        <div className="flex items-center gap-2">
          <Switch
            checked={isInvoice} // Controlled by form value
            onCheckedChange={handleSwitchChange}
          />
          <span className="text-sm">
            {isInvoice ? "Invoice" : "Quote"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <FormInput
            name="details.invoiceNumber"
            label={_t("form.steps.invoiceDetails.invoiceNumber")}
            placeholder="Invoice number"
            value={loading ? "Loading..." : invoiceNum}
            readOnly
          />
          <DatePickerFormField
            name="details.invoiceDate"
            label={_t("form.steps.invoiceDetails.issuedDate")}
            defaultToday={true}
          />
          <DatePickerFormField
            name="details.dueDate"
            label={_t("form.steps.invoiceDetails.dueDate")}
          />
        </div>
      </div>
    </section>
  );
};

export default InvoiceDetails;