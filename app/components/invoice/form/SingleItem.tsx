"use client";
import { useEffect, useState } from "react";

// RHF
import { FieldArrayWithId, useFormContext, useWatch } from "react-hook-form";

// DnD
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ShadCn
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Components
import { BaseButton, FormTextarea } from "@/app/components";

// Icons
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";

// Types and Variables
import { ItemType, NameType } from "@/types";
import { UNIT_TYPES } from "@/lib/variables";

type SingleItemProps = {
  name: NameType;
  index: number;
  fields: ItemType[];
  field: FieldArrayWithId<ItemType>;
  moveFieldUp: (index: number) => void;
  moveFieldDown: (index: number) => void;
  removeField: (index: number) => void;
};

const SingleItem = ({
  name,
  index,
  fields,
  field,
  moveFieldUp,
  moveFieldDown,
  removeField,
}: SingleItemProps) => {
  const { control, setValue, register } = useFormContext();

  // Local state for unitType
  const [unitType, setUnitType] = useState<string>(""); // Default to 'pcs'

  // Watch form values
  const itemName = useWatch({
    name: `${name}[${index}].name`,
    control,
  });

  const rate = useWatch({
    name: `${name}[${index}].unitPrice`,
    control,
  });

  const quantity = useWatch({
    name: `${name}[${index}].quantity`,
    control,
  });

  const total = useWatch({
    name: `${name}[${index}].total`,
    control,
  });

  const formUnitType = useWatch({
    name: `${name}[${index}].unitType`,
    control,
  });

  // Currency
  const currency = useWatch({
    name: `details.currency`,
    control,
  });

  // Sync local state with form state on mount or when formUnitType changes
  useEffect(() => {
    
      setValue(`${name}[${index}].unitType`, unitType, { shouldValidate: true });
    
  }, [unitType, setValue, name, index]);

  // Calculate total when rate or quantity changes
  useEffect(() => {
    if (rate !== undefined && quantity !== undefined) {
      const calculatedTotal = Number(rate) * Number(quantity);
      if (!isNaN(calculatedTotal)) {
        setValue(`${name}[${index}].total`, calculatedTotal.toFixed(2));
      }
    }
  }, [rate, quantity, setValue, name, index]);

  console.log(unitType)
  // Handle unitType change
  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnitType = e.target.value;
    setUnitType(selectedUnitType); // Update local state
    setValue(`${name}[${index}].unitType`, selectedUnitType, {
      shouldValidate: true,
    }); // Update form state
  };

  // DnD functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const boxDragClasses = isDragging
    ? "border-2 bg-gray-200 border-blue-600 dark:bg-slate-900 z-10"
    : "border";

  const gripDragClasses = isDragging
    ? "opacity-0 group-hover:opacity-100 transition-opacity cursor-grabbing"
    : "cursor-grab";

  // Normalize input value to remove leading zeros
  const normalizeNumber = (
    value: string | number | undefined
  ): number | undefined => {
    if (value === undefined || value === "") return 0;
    const num = parseFloat(value.toString());
    return isNaN(num) ? 0 : num;
  };

  return (
    <div
      style={style}
      {...attributes}
      className={`${boxDragClasses} group flex flex-col gap-y-5 p-3 my-2 cursor-default rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600`}
    >
      <div className="flex flex-wrap justify-between">
        {itemName != "" ? (
          <p className="font-medium text-wrap">
            #{index + 1} - {itemName}
          </p>
        ) : (
          <p className="font-medium">#{index + 1} - Empty name</p>
        )}

        <div className="flex gap-3">
          {/* Drag and Drop Button */}
          <div
            className={`${gripDragClasses} flex justify-center items-center`}
            ref={setNodeRef}
            {...listeners}
          >
            <GripVertical className="hover:text-blue-600" />
          </div>

          {/* Up Button */}
          <BaseButton
            size={"icon"}
            tooltipLabel={"Move the item up"}
            onClick={() => moveFieldUp(index)}
            disabled={index === 0}
          >
            <ChevronUp />
          </BaseButton>

          {/* Down Button */}
          <BaseButton
            size={"icon"}
            tooltipLabel={"Move the item down"}
            onClick={() => moveFieldDown(index)}
            disabled={index === fields.length - 1}
          >
            <ChevronDown />
          </BaseButton>
        </div>
      </div>
      <div
        className="flex flex-wrap justify-between gap-y-5 gap-x-2"
        key={index}
      >
        <FormTextarea
          name={`${name}[${index}].name`}
          label={"Item Name"}
          placeholder={"Item Name"}
          rows={1}
          className="w-full min-h-[2.5rem] resize-y text-wrap"
        />

        {/* Unit Type Dropdown */}
        <div className="w-[8rem]">
          <Label>{"Unit Type"}</Label>
          <select
            {...register(`${name}[${index}].unitType`, {
              validate: (value) =>
                UNIT_TYPES.includes(value) || "Please select a valid unit type",
            })}
            onChange={handleUnitTypeChange}
            value={unitType} // Use local state
            className="flex h-10 mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>
              {"Select Unit"}
            </option>
            {UNIT_TYPES.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity Input */}
        <div className="w-[8rem]">
          <Label>{"Quantity"}</Label>
          <Input
            type="number"
            {...register(`${name}[${index}].quantity`, {
              setValueAs: (value) => normalizeNumber(value),
            })}
            placeholder={"Quantity"}
            className="w-full mt-2"
            step="1"
            min="0"
            defaultValue={0}
            onChange={(e) => {
              const value = normalizeNumber(e.target.value);
              setValue(`${name}[${index}].quantity`, value, {
                shouldValidate: true,
              });
            }}
          />
        </div>

        {/* Unit Price Input */}
        <div className="w-[8rem]">
          <Label>
            {"Rate"} ({currency})
          </Label>
          <Input
            type="number"
            {...register(`${name}[${index}].unitPrice`, {
              setValueAs: (value) => normalizeNumber(value),
            })}
            placeholder={"Rate"}
            className="w-full mt-2"
            step="0.01"
            min="0"
            defaultValue={0}
            onChange={(e) => {
              const value = normalizeNumber(e.target.value);
              setValue(`${name}[${index}].unitPrice`, value, {
                shouldValidate: true,
              });
            }}
          />
        </div>
      </div>
      <div>
        {fields.length > 1 && (
          <BaseButton variant="destructive" onClick={() => removeField(index)}>
            <Trash2 />
            {"Remove Item"}
          </BaseButton>
        )}
      </div>
    </div>
  );
};

export default SingleItem;