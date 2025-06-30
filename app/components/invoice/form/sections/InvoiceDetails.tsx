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
  const [loading, setLoading] = useState(false);
  const [invoiceNum, setInvoiceNum] = useState(getValues("details.invoiceNumber") || "");

  const isInvoice = watch("details.isInvoice"); // Watch the form value
  const invoiceNumber = watch("details.invoiceNumber"); // Watch invoice number

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      // Only fetch if invoiceNumber is empty or undefined (new invoice or reset)
      if (invoiceNumber && invoiceNumber !== "") {
        setInvoiceNum(invoiceNumber); // Sync invoiceNum with form value
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/invoice/next-number");
        const data = await response.json();
        if (response.ok && data.invoiceNumber) {
          let invoiceNumber = data.invoiceNumber;
          const isInvoiceValue = invoiceNumber.startsWith("INV");
          setValue("details.isInvoice", isInvoiceValue, {
            shouldValidate: true,
          });
          setValue("details.invoiceNumber", invoiceNumber, {
            shouldValidate: true,
          });
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
  }, [setValue, invoiceNumber]);

  const handleSwitchChange = (checked: any) => {
    setValue("details.isInvoice", checked, { shouldValidate: true });
    if (invoiceNum) {
      const newInvoiceNum = checked
        ? invoiceNum.replace(/^QUT-/, "INV-")
        : invoiceNum.replace(/^INV-/, "QUT-");
      setValue("details.invoiceNumber", newInvoiceNum, {
        shouldValidate: true,
      });
      setInvoiceNum(newInvoiceNum);
    }
  };

  return (
    <section className="flex flex-col flex-wrap gap-5">
      <Subheading>{_t("form.steps.invoiceDetails.heading")}:</Subheading>
      <div className="flex flex-row flex-wrap gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 w-full mb-2">
            <label>Invoice Type</label>
            <div className="flex items-center gap-4">
              <span className="text-sm ml-[50px] ">Quote</span>
              <Switch  
                checked={isInvoice}
                onCheckedChange={handleSwitchChange}
              />
              <span className="text-sm">Invoice</span>
            </div>
          </div>
          <FormInput
            name="details.invoiceNumber"
            label={_t("form.steps.invoiceDetails.invoiceNumber")}
            placeholder="Invoice number"
            value={loading ? "Loading..." : invoiceNum}
            readOnly
            className="text-center w-[13rem]"
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