"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BaseButton, FormInput, Subheading } from "@/app/components";
import { useTranslationContext } from "@/contexts/TranslationContext";
import { Button } from "@/components/ui/button";
import CreateUserDialog from "@/components/createUserDialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ChevronsUpDown, Check } from "lucide-react";

interface User {
  _id: string;
  name: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
}

// Remove setDialogOpen from props since we'll manage it locally
interface BillToSectionProps {}

const BillToSection = ({}: BillToSectionProps) => {
  const { control, setValue } = useFormContext();
  const { _t } = useTranslationContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false); // Manage dialog state locally

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/invoice/customer", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: User[] = await response.json();
        setUsers(data);
        setError(null);
      } catch (err: any) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (user: User) => {
    setValue("receiver.name", user.name, { shouldValidate: true });
    setValue("receiver.address", user.address, { shouldValidate: true });
    setValue("receiver.state", user.state, { shouldValidate: true });
    setValue("receiver.country", user.country, { shouldValidate: true });
    setValue("receiver.email", user.email, { shouldValidate: true });
    setValue("receiver.phone", user.phone, { shouldValidate: true });
    setSelectedUserId(user._id);
    setOpen(false);
  };

  const handleUserCreated = (newUser?: User) => {
    if (newUser && newUser._id) {
      setUsers((prevUsers) => {
        const updatedUsers = [...prevUsers, newUser];
        return updatedUsers;
      });
      setError(null);
      handleUserSelect(newUser);
    } else {
      setLoading(true);
      fetch("/api/invoice/customer", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data: User[]) => {
          setUsers(data);
          setError(null);
        })
        .catch((err: any) => {
          setError("Failed to refresh users");
        })
        .finally(() => setLoading(false));
    }
    setDialogOpen(false); // Close dialog after user creation
  };

  return (
    <section className="flex flex-col gap-3">
      <Subheading>{_t("form.steps.fromAndTo.billTo")}:</Subheading>

      <div className="flex gap-3">
        <div className="rounded-sm border border-white w-[200px]">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={loading}
              >
                {selectedUserId
                  ? users.find((user) => user._id === selectedUserId)?.name ||
                    "Select a customer..."
                  : loading
                  ? "Loading customers..."
                  : "Select a customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  <CommandEmpty>No customer found.</CommandEmpty>
                  <CommandGroup>
                    {users?.map((user) => (
                      <CommandItem
                        key={user._id}
                        value={user.name}
                        onSelect={() => handleUserSelect(user)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === user._id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {user.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <CreateUserDialog onUserCreated={handleUserCreated} setDialogOpen={setDialogOpen} />
      </div>

      <FormInput
        name="receiver.name"
        label={_t("form.steps.fromAndTo.name")}
        placeholder="Receiver name"
        readOnly
      />
      <FormInput
        name="receiver.email"
        label={_t("form.steps.fromAndTo.email")}
        placeholder="Receiver email"
        readOnly
      />
      <FormInput
        readOnly
        name="receiver.phone"
        label={_t("form.steps.fromAndTo.phone")}
        placeholder="Receiver phone number"
        type="text"
        inputMode="tel"
        pattern="[0-9+\-\(\)\s]*"
        aria-describedby="phone-format"
        onInput={(e) => {
          const target = e.target as HTMLInputElement;
          target.value = target.value.replace(/[^\d\+\-\(\)\s]/g, "");
        }}
      />
      <FormInput
        readOnly
        name="receiver.address"
        label={_t("form.steps.fromAndTo.address")}
        placeholder="Receiver address"
      />
      <FormInput
        readOnly
        name="receiver.state"
        label={"State"}
        placeholder="Receiver state"
      />
    </section>
  );
};

export default BillToSection;