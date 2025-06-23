"use client";

import React, { useCallback, useState } from "react";

// RHF
import { useFieldArray, useFormContext } from "react-hook-form";

// DnD
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    UniqueIdentifier,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

// Components
import { BaseButton, SingleItem, Subheading } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Plus } from "lucide-react";

// Types
import { InvoiceType } from "@/types";

type ItemsProps = {
    // Add any props if needed
};

const Items: React.FC<ItemsProps> = () => {
    const { control, setValue, getValues } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();

    const ITEMS_NAME = "details.items";
    const { fields, append, remove, move } = useFieldArray({
        control: control,
        name: ITEMS_NAME,
    });

    const addNewField = () => {
        const newItem = {
            name: "",
            description: "",
            quantity: 0,
            unitPrice: 0,
            total: 0,
            unitType: "", // Add default unitType
        };
        append(newItem);
        console.log("New Item Added:", getValues(ITEMS_NAME)); // Debug form state
    };

    const removeField = (index: number) => {
        remove(index);
        console.log("Item Removed, Form State:", getValues(ITEMS_NAME)); // Debug form state
    };

    const moveFieldUp = (index: number) => {
        if (index > 0) {
            move(index, index - 1);
            console.log("Moved Up, Form State:", getValues(ITEMS_NAME)); // Debug form state
        }
    };

    const moveFieldDown = (index: number) => {
        if (index < fields.length - 1) {
            move(index, index + 1);
            console.log("Moved Down, Form State:", getValues(ITEMS_NAME)); // Debug form state
        }
    };

    // DnD
    const [activeId, setActiveId] = useState<UniqueIdentifier>();
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(active.id);

            if (over && active.id !== over.id) {
                const oldIndex = fields.findIndex(
                    (item) => item.id === active.id
                );
                const newIndex = fields.findIndex(
                    (item) => item.id === over.id
                );

                move(oldIndex, newIndex);
                console.log("Dragged, Form State:", getValues(ITEMS_NAME)); // Debug form state
            }
        },
        [fields, move, getValues]
    );

    return (
        <section className="flex flex-col gap-2 w-full">
            <Subheading>{_t("form.steps.lineItems.heading")}:</Subheading>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => {
                    setActiveId(event.active.id);
                }}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={fields}
                    strategy={verticalListSortingStrategy}
                >
                    {fields.map((field, index) => (
                        <SingleItem
                            key={field.id}
                            name={ITEMS_NAME}
                            index={index}
                            fields={fields}
                            field={field}
                            moveFieldUp={moveFieldUp}
                            moveFieldDown={moveFieldDown}
                            removeField={removeField}
                        />
                    ))}
                </SortableContext>
            </DndContext>
            <BaseButton
                tooltipLabel="Add a new item to the list"
                onClick={addNewField}
                aria-label="Add new item"
            >
                <Plus />
                {_t("form.steps.lineItems.addNewItem")}
            </BaseButton>
        </section>
    );
};

export default Items;