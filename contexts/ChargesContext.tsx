"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { formatPriceToString } from "@/lib/helpers";
import { InvoiceType, ItemType } from "@/types";
import { SetStateAction } from "react";

const defaultChargesContext = {
    discountSwitch: false,
    setDiscountSwitch: (newValue: boolean) => {},
    taxSwitch: false,
    setTaxSwitch: (newValue: boolean) => {},
    shippingSwitch: false,
    setShippingSwitch: (newValue: boolean) => {},
    discountType: "amount",
    setDiscountType: (newValue: SetStateAction<string>) => {},
    taxType: "percentage",
    setTaxType: (newValue: SetStateAction<string>) => {},
    shippingType: "amount",
    setShippingType: (newValue: SetStateAction<string>) => {},
    totalInWordsSwitch: false,
    setTotalInWordsSwitch: (newValue: boolean) => {},
    currency: "AED",
    subTotal: 0,
    totalAmount: 0,
    calculateTotal: () => {},
};

export const ChargesContext = createContext(defaultChargesContext);

export const useChargesContext = () => {
    return useContext(ChargesContext);
};

type ChargesContextProps = {
    children: React.ReactNode;
};

export const ChargesContextProvider = ({ children }: ChargesContextProps) => {
    const { control, setValue, getValues } = useFormContext<InvoiceType>();
    const { newInvoiceTrigger } = useInvoiceContext();

    const itemsArray = useWatch({ name: `details.items`, control });
    const currency = useWatch({ name: `details.currency`, control });

    const charges = {
        discount: useWatch({ name: `details.discountDetails`, control }) || {
            amount: 0,
            amountType: "amount",
        },
        tax: useWatch({ name: `details.taxDetails`, control }) || {
            amount: 0,
            amountType: "percentage",
        },
        shipping: useWatch({ name: `details.shippingDetails`, control }) || {
            cost: 0,
            costType: "amount",
        },
    };

    const { discount, tax, shipping } = charges;

    const [discountSwitch, setDiscountSwitch] = useState<boolean>(false);
    const [taxSwitch, setTaxSwitch] = useState<boolean>(false);
    const [shippingSwitch, setShippingSwitch] = useState<boolean>(false);
    const [totalInWordsSwitch, setTotalInWordsSwitch] = useState<boolean>(false);
    const [discountType, setDiscountType] = useState<string>("amount");
    const [taxType, setTaxType] = useState<string>("percentage");
    const [shippingType, setShippingType] = useState<string>("amount");
    const [subTotal, setSubTotal] = useState<number>(0);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    // Reset switches and types on new invoice
    useEffect(() => {
        setDiscountSwitch(false);
        setTaxSwitch(false);
        setShippingSwitch(false);
        setDiscountType("amount");
        setTaxType("percentage");
        setShippingType("amount");
        setTotalInWordsSwitch(false);
        setValue("details.discountDetails.amount", 0);
        setValue("details.taxDetails.amount", 0);
        setValue("details.shippingDetails.cost", 0);
        setValue("details.discountDetails.amountType", "amount");
        setValue("details.taxDetails.amountType", "percentage");
        setValue("details.shippingDetails.costType", "amount");
        setValue("details.totalAmountInWords", "");
        console.log("Reset: totalInWordsSwitch set to false, totalAmountInWords cleared");
    }, [newInvoiceTrigger, setValue]);

    // Sync switches and types with form values when loading an invoice
    useEffect(() => {
        if (discount?.amount) {
            setDiscountSwitch(true);
        }
        if (tax?.amount) {
            setTaxSwitch(true);
        }
        if (shipping?.cost) {
            setShippingSwitch(true);
        }
        setDiscountType(discount?.amountType || "amount");
        setTaxType(tax?.amountType || "percentage");
        setShippingType(shipping?.costType || "amount");
    }, [discount?.amount, tax?.amount, shipping?.cost, discount?.amountType, tax?.amountType, shipping?.costType]);

    // Handle tax switch toggle
    useEffect(() => {
        if (taxSwitch) {
            setValue("details.taxDetails.amount", 5);
            setValue("details.taxDetails.amountType", "percentage");
            setTaxType("percentage");
        } else {
            setValue("details.taxDetails.amount", 0);
            setValue("details.taxDetails.amountType", "percentage");
            setTaxType("percentage");
        }
    }, [taxSwitch, setValue]);

    // Reset form values to 0 when other switches are off
    useEffect(() => {
        if (!discountSwitch) {
            setValue("details.discountDetails.amount", 0);
        }
        if (!shippingSwitch) {
            setValue("details.shippingDetails.cost", 0);
        }
        if (!totalInWordsSwitch) {
            setValue("details.totalAmountInWords", "");
            console.log("totalInWordsSwitch is off, totalAmountInWords set to empty string");
        }
    }, [discountSwitch, shippingSwitch, totalInWordsSwitch, setValue]);

    // Calculate total when values change
    useEffect(() => {
        calculateTotal();
    }, [
        itemsArray,
        totalInWordsSwitch,
        discountType,
        discount?.amount,
        taxType,
        tax?.amount,
        shippingType,
        shipping?.cost,
        currency,
    ]);

    const calculateTotal = () => {
        const totalSum: number = itemsArray.reduce(
            (sum: number, item: ItemType) => sum + Number(item.total),
            0
        );

        setValue("details.subTotal", totalSum);
        setSubTotal(totalSum);

        let discountAmount: number = parseFloat(discount!.amount.toString()) ?? 0;
        let taxAmount: number = parseFloat(tax!.amount.toString()) ?? 0;
        let shippingCost: number = parseFloat(shipping!.cost.toString()) ?? 0;

        let discountAmountType: string = "amount";
        let taxAmountType: string = "percentage";
        let shippingCostType: string = "amount";

        let total: number = totalSum;

        if (!isNaN(discountAmount) && discountSwitch) {
            if (discountType === "amount") {
                total -= discountAmount;
                discountAmountType = "amount";
            } else {
                total -= total * (discountAmount / 100);
                discountAmountType = "percentage";
            }
            setValue("details.discountDetails.amount", discountAmount);
        }

        if (!isNaN(taxAmount) && taxSwitch) {
            if (taxType === "amount") {
                total += taxAmount;
                taxAmountType = "amount";
            } else {
                total += total * (taxAmount / 100);
                taxAmountType = "percentage";
            }
            setValue("details.taxDetails.amount", taxAmount);
        }

        if (!isNaN(shippingCost) && shippingSwitch) {
            if (shippingType === "amount") {
                total += shippingCost;
                shippingCostType = "amount";
            } else {
                total += total * (shippingCost / 100);
                shippingCostType = "percentage";
            }
            setValue("details.shippingDetails.cost", shippingCost);
        }

        setTotalAmount(total);

        setValue("details.discountDetails.amountType", discountAmountType);
        setValue("details.taxDetails.amountType", taxAmountType);
        setValue("details.shippingDetails.costType", shippingCostType);

        setValue("details.totalAmount", total);

        if (totalInWordsSwitch) {
            setValue("details.totalAmountInWords", formatPriceToString(total, getValues("details.currency")));
            console.log("totalInWordsSwitch is on, totalAmountInWords set to:", formatPriceToString(total, getValues("details.currency")));
        } else {
            setValue("details.totalAmountInWords", "");
            console.log("totalInWordsSwitch is off, totalAmountInWords cleared");
        }
    };

    return (
        <ChargesContext.Provider
            value={{
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
                calculateTotal,
            }}
        >
            {children}
        </ChargesContext.Provider>
    );
};