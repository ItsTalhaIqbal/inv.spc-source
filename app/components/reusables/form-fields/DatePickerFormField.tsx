"use client";

import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DATE_OPTIONS } from "@/lib/variables";
import { CalendarIcon } from "lucide-react";
import { NameType } from "@/types";

type DatePickerFormFieldProps = {
  name: NameType;
  label?: string;
  defaultToday?: boolean;
};

const DatePickerFormField = ({
  name,
  label,
  defaultToday = false,
}: DatePickerFormFieldProps) => {
  const { control, setValue } = useFormContext();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    if (defaultToday) {
      const today = new Date();
      setValue(name, today.toString(), { shouldValidate: true });
    }
  }, [defaultToday, name, setValue]);

  return (
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
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[13rem]",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        new Date(field.value).toLocaleDateString(
                          "en-US",
                          DATE_OPTIONS
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
                    defaultMonth={
                      field.value ? new Date(field.value) : new Date()
                    }
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date.toString());
                        setValue(name, date.toString(), { shouldValidate: true });
                      }
                      setIsPopoverOpen(false);
                    }}
                    disabled={(date) => date < new Date("1900-01-01")}
                    fromYear={1960}
                    toYear={new Date().getFullYear() + 30}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </div>
          </div>
        </FormItem>
      )}
    />
  );
};

export default DatePickerFormField;