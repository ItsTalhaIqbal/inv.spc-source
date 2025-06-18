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

const Charges = () => {
    const {
        formState: { errors },
        setValue,
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

    // Hardcode tax to 5% and set type to percentage when tax is enabled
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
        if (type === "amount") {
            setType("percentage");
        } else {
            setType("amount");
        }
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
                    <ChargeInput
                        label={_t("form.steps.summary.discount")}
                        name="details.discountDetails.amount"
                        switchAmountType={switchAmountType}
                        type={discountType}
                        setType={setDiscountType}
                        currency={currency}
                    />
                )}

                {taxSwitch && (
                    <ChargeInput
                        label={_t("form.steps.summary.tax")}
                        name="details.taxDetails.amount"
                        switchAmountType={switchAmountType}
                        type={taxType}
                        setType={setTaxType}
                        currency={currency}
                    />
                )}

                {shippingSwitch && (
                    <ChargeInput
                        label={_t("form.steps.summary.shipping")}
                        name="details.shippingDetails.cost"
                        switchAmountType={switchAmountType}
                        type={shippingType}
                        setType={setShippingType}
                        currency={currency}
                    />
                )}

                <div className="flex justify-between items-center">
                    <div>{_t("form.steps.summary.totalAmount")}</div>
                    <div>
                        <p>
                            {formatNumberWithCommas(totalAmount)} {currency}
                        </p>
                        <small className="text-sm font-medium text-destructive">
                            {errors.details?.totalAmount?.message}
                        </small>
                    </div>
                </div>

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
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Charges;