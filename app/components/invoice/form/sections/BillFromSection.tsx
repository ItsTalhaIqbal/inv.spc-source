"use client";

// RHF
import { useFormContext } from "react-hook-form";

// Components
import { FormInput, Subheading } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

const BillFromSection = () => {
    const { control } = useFormContext();
    const { _t } = useTranslationContext();

    const senderData = {
        name: "SPC sources",
        country: "UAE",
        state: "Dubai",
        email: "contact@spcsource.com",
        address: "Dragon Mart 1, Office GBT03, Dubai",
        phone: "+971 54 500 4520",
    };


    return (
        <section className="flex flex-col gap-3">
            <Subheading>{_t("form.steps.fromAndTo.billFrom")}:</Subheading>

            <FormInput
                name="sender.name"
                label={_t("form.steps.fromAndTo.name")}
                value={senderData.name}
                disabled
            />
            <FormInput
                name="sender.address"
                label={_t("form.steps.fromAndTo.address")}
                value={senderData.address}
                disabled
            />

            <FormInput
                name="sender.state"
                label={_t("form.steps.fromAndTo.state")}
                value={senderData.state}
                disabled
            />
            <FormInput
                name="sender.country"
                label={_t("form.steps.fromAndTo.country")}
                value={senderData.country}
                disabled
            />
            <FormInput
                name="sender.email"
                label={_t("form.steps.fromAndTo.email")}
                value={senderData.email}
                disabled
            />
            <FormInput
                name="sender.phone"
                label={_t("form.steps.fromAndTo.phone")}
                value={senderData.phone}
                type="text"
                inputMode="tel"
                disabled
                aria-describedby="phone-format"
            />
        </section>
    );
};

export default BillFromSection;