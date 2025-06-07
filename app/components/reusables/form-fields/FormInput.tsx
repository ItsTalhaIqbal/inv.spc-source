"use client";

import { forwardRef } from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input, InputProps } from "@/components/ui/input";

type FormInputProps = {
    name: string;
    label?: string;
    labelHelper?: string;
    placeholder?: string;
    vertical?: boolean;
} & InputProps;

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    { name, label, labelHelper, placeholder, vertical = false, ...props },
    ref
  ) => {
    const { control } = useFormContext();

    const verticalInput = (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            {label && <FormLabel>{`${label}:`}</FormLabel>}
            {labelHelper && <span className="text-xs"> {labelHelper}</span>}
            <FormControl>
              <Input
                {...field}
                placeholder={placeholder}
                className="w-[13rem]"
                {...props}
                ref={ref} // Forward ref to the Input component
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );

    const horizontalInput = (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className="flex w-full gap-5 items-center text-sm">
              {label && <FormLabel className="flex-1">{`${label}:`}</FormLabel>}
              {labelHelper && <span className="text-xs"> {labelHelper}</span>}
              <div className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    placeholder={placeholder}
                    className="w-[13rem]"
                    {...props}
                    ref={ref} // Forward ref to the Input component
                  />
                </FormControl>
                <FormMessage />
              </div>
            </div>
          </FormItem>
        )}
      />
    );

    return vertical ? verticalInput : horizontalInput;
  }
);

FormInput.displayName = "FormInput"; // For better debugging in React DevTools

export default FormInput;