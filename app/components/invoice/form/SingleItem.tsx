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
  fields: FieldArrayWithId<ItemType>[]; // Renamed from items to fields
  field: FieldArrayWithId<ItemType>;
  moveFieldUp: (index: number) => void;
  moveFieldDown: (index: number) => void;
  removeField: (index: number) => void;
};

const SingleItem = ({
  name,
  index,
  fields, // Renamed from items to fields
  field,
  moveFieldUp,
  moveFieldDown,
  removeField,
}: SingleItemProps) => {
  const { control, setValue, register } = useFormContext();

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

  const currency = useWatch({
    name: `details.currency`,
    control,
  });

  const formUnitType = useWatch({
    name: `${name}[${index}].unitType`,
    control,
  });

  // State for unitType, initialized with form value
  const [unitType, setUnitType] = useState<string>(formUnitType || "");

  // Calculate total
  useEffect(() => {
    if (rate !== undefined && quantity !== undefined) {
      const calculatedTotal = Number(rate) * Number(quantity);
      if (!isNaN(calculatedTotal)) {
        setValue(`${name}[${index}].total`, calculatedTotal.toFixed(2));
      }
    }
  }, [rate, quantity, setValue, name, index]);

  // Handle unitType change
  const handleUnitTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUnitType = e.target.value;
    setUnitType(selectedUnitType); // Update local state

    // Update itemName to include unitType in format "itemName\n(unitType)"
    const currentItemName = itemName || "";
    const baseName = currentItemName.split("\n")[0].trim(); // e.g., "juice"
    const formattedName = baseName ;
    setValue(`${name}[${index}].name`, formattedName, { shouldValidate: true });
    setValue(`${name}[${index}].unitType`, selectedUnitType, { shouldValidate: true });
  };

  // DnD
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

  // Normalize input
  const normalizeNumber = (
    value: string | number | undefined
  ): number | undefined => {
    if (value === undefined || value === "") return undefined;
    const num = parseFloat(value.toString());
    return isNaN(num) ? undefined : num;
  };

  return (
    <div
      style={style}
      {...attributes}
      className={`${boxDragClasses} group flex flex-col gap-y-5 p-3 my-2 cursor-default rounded-xl bg-gray-50 dark:bg-slate-800 dark:border-gray-600`}
    >
      <div className="flex flex-wrap justify-between">
        {itemName ? (
          <p className="font-medium text-wrap font-sans text-center text-base leading-tight whitespace-pre-line">
            #{index + 1} - {itemName}
          </p>
        ) : (
          <p className="font-medium">#{index + 1} - Empty name</p>
        )}

        <div className="flex gap-3">
          {/* Drag and Drop */}
          <div
            className={`${gripDragClasses} flex justify-center items-center`}
            ref={setNodeRef}
            {...listeners}
          >
            <GripVertical className="hover:text-blue-600" />
          </div>

          {/* Up */}
          <BaseButton
            size={"icon"}
            tooltipLabel={"Move the item up"}
            onClick={() => moveFieldUp(index)}
            disabled={index === 0}
          >
            <ChevronUp />
          </BaseButton>

          {/* Down */}
          <BaseButton
            size={"icon"}
            tooltipLabel={"Move the item down"}
            onClick={() => moveFieldDown(index)}
            disabled={index === fields.length - 1} // Updated to fields
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
          className="w-full min-h-[2.5rem] resize-y text-wrap font-sans text-center text-base leading-tight"
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
            value={unitType}
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

        {/* Quantity */}
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

        {/* Unit Price */}
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
        {fields.length > 1 && ( // Updated to fields
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
