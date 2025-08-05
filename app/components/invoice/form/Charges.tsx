"use client";

import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChargeInput } from "@/app/components";
import { useChargesContext } from "@/contexts/ChargesContext";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { formatNumberWithCommas } from "@/lib/helpers";
import { InvoiceType } from "@/types";
import { SetStateAction } from "react";
import { useTheme } from "next-themes";
import { RotateCcw } from "lucide-react";

interface ChargeInputProps {
  label: string;
  name: string;
  switchAmountType: (type: string, setType: (value: SetStateAction<string>) => void) => void;
  type: string;
  setType: (value: SetStateAction<string>) => void;
  currency: string;
  onValueChange: (name: string, value: string) => void;
  value: string;
  readOnly?: boolean;
}

const ChargeInputComponent = ({
  label,
  name,
  switchAmountType,
  type,
  setType,
  currency,
  onValueChange,
  value,
  readOnly = false,
}: ChargeInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (/^\d*\.?\d*$/.test(inputValue)) {
      onValueChange(name, inputValue);
    }
  };
  const {theme} = useTheme()

  return (
    <div className="flex justify-between items-center">
      <div>{label}</div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className={`w-20 border ${theme == 'dark'?"bg-gray-700":"bg-gray-50"} rounded px-2 py-1`}
          readOnly={readOnly}
        />
        <span>{type === "percentage" ? "%" : currency}</span>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 py-2 px-3"
          onClick={() => switchAmountType(type, setType)}
        >
          <RotateCcw />
        </button>
      </div>
    </div>
  );
};

const Charges = () => {
  const {
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<InvoiceType>();

  const { _t } = useTranslationContext();

  const {
    discountSwitch,
    setDiscountSwitch,
    taxSwitch,
    setTaxSwitch,
    shippingSwitch,
    setShippingSwitch,
    discountType,
    setDiscountType,
    taxType,
    setTaxType,
    shippingType,
    setShippingType,
    totalInWordsSwitch,
    setTotalInWordsSwitch,
    currency,
    subTotal,
    totalAmount,
  } = useChargesContext();

  useEffect(() => {
    if (taxSwitch) {
      setValue("details.taxDetails.amount", 5);
      setTaxType("percentage");
    } else {
      setValue("details.taxDetails.amount", 0);
      setTaxType("percentage");
    }
  }, [taxSwitch, setValue, setTaxType]);

  const switchAmountType = (
    type: string,
    setType: (value: SetStateAction<string>) => void
  ) => {
    setType(type === "amount" ? "percentage" : "amount");
  };

  const handleValueChange = (name: string, value: string) => {
    let processedValue = value.replace(/^0+(?=\d)/, '');
    if (processedValue === '') processedValue = '0';
    if (processedValue.endsWith('.')) {
      processedValue = processedValue.replace(/\.$/, '');
    }
    setValue(name as any, processedValue);
  };

  return (
    <div className="flex flex-col gap-3 min-w-[20rem]">
      <div className="flex justify-evenly pb-6">
        <div>
          <Label>{_t("form.steps.summary.discount")}</Label>
          <div>
            <Switch
              checked={discountSwitch}
              onCheckedChange={(value) => {
                setDiscountSwitch(value);
                if (!value) {
                  setValue("details.discountDetails.amount", 0);
                }
              }}
            />
          </div>
        </div>

        <div>
          <Label>{_t("form.steps.summary.tax")}</Label>
          <div>
            <Switch
              checked={taxSwitch}
              onCheckedChange={(value) => {
                setTaxSwitch(value);
              }}
            />
          </div>
        </div>

        <div>
          <Label>{_t("form.steps.summary.shipping")}</Label>
          <div>
            <Switch
              checked={shippingSwitch}
              onCheckedChange={(value) => {
                setShippingSwitch(value);
                if (!value) {
                  setValue("details.shippingDetails.cost", 0);
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center px-5 gap-y-3">
        <div className="flex justify-between items-center">
          <div>{_t("form.steps.summary.subTotal")}</div>
          <div>
            {formatNumberWithCommas(subTotal)} {currency}
          </div>
        </div>

        {discountSwitch && (
          <ChargeInputComponent
            label={_t("form.steps.summary.discount")}
            name="details.discountDetails.amount"
            switchAmountType={switchAmountType}
            type={discountType}
            setType={setDiscountType}
            currency={currency}
            onValueChange={handleValueChange}
            value={watch("details.discountDetails.amount")?.toString() || "0"}
          />
        )}

        {taxSwitch && (
          <ChargeInputComponent
            label={_t("form.steps.summary.tax")}
            name="details.taxDetails.amount"
            switchAmountType={switchAmountType}
            type={taxType}
            setType={setTaxType}
            currency={currency}
            onValueChange={handleValueChange}
            value={watch("details.taxDetails.amount")?.toString() || "0"}
          />
        )}

        {shippingSwitch && (
          <ChargeInputComponent
            label={_t("form.steps.summary.shipping")}
            name="details.shippingDetails.cost"
            switchAmountType={switchAmountType}
            type={shippingType}
            setType={setShippingType}
            currency={currency}
            onValueChange={handleValueChange}
            value={watch("details.shippingDetails.cost")?.toString() || "0"}
          />
        )}

        <div className="flex justify-between items-center">
          <div>{_t("form.steps.summary.totalAmount")}</div>
          <div>
            <p>
              {formatNumberWithCommas(totalAmount)} {currency}
            </p>
          </div>
        </div>
        <small className="text-sm font-medium text-destructive ">
          {errors.details?.totalAmount?.message}
        </small>

        <div className="flex justify-between items-center">
          <p>{_t("form.steps.summary.includeTotalInWords")}</p>
          <p>
            {totalInWordsSwitch
              ? _t("form.steps.summary.yes")
              : _t("form.steps.summary.no")}
          </p>
          <Switch
            checked={totalInWordsSwitch}
            onCheckedChange={(value) => {
              setTotalInWordsSwitch(value);
              if (!value) {
                setValue("details.totalAmountInWords", "");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Charges;