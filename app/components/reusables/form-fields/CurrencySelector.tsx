"use client";

// RHF
import { useFormContext } from "react-hook-form";
import { useEffect } from "react";

// ShadCn
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
import { NameType } from "@/types";

type CurrencySelectorProps = {
  name: NameType;
  label?: string;
  placeholder?: string;
};

const CurrencySelector = ({ name, label, placeholder }: CurrencySelectorProps) => {
  const { control, setValue } = useFormContext();

  // Set details.currency to AED on mount
  useEffect(() => {
    setValue(name, "AED");
  }, [name, setValue]);

  return (
    <div>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex justify-between gap-5 items-center text-sm">
              <div>
                <FormLabel>{label}:</FormLabel>
              </div>
              <div>
                <Select
                  {...field}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-[13rem]">
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent
                    style={{
                      overflowY: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    <SelectGroup>
                      <SelectLabel>Currencies</SelectLabel>
                      <SelectItem value="AED">United Arab Emirates Dirham (AED)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default CurrencySelector;