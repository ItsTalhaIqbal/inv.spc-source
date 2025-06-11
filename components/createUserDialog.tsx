"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBasePath } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  address: string;
  state: string;
  country: string;
  email: string;
  phone: string;
}

interface CreateUserDialogProps {
  onUserCreated?: (user: User) => void;
  setDialogOpen: (open: boolean) => void;
}

const CreateUserDialog = ({
  onUserCreated,
  setDialogOpen,
}: CreateUserDialogProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("UAE");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const pathName = usePathname();

  const uaeEmirates = [
    "Abu Dhabi",
    "Ajman",
    "Dubai",
    "Fujairah",
    "Ras Al Khaimah",
    "Sharjah",
    "Umm Al Quwain",
  ];

  const handleSubmit = async () => {
    if (!name || !address || !state || !country || !email || !phone) {
      setError("All fields are required");
      setSuccess(false);
      return;
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("Invalid email address");
      setSuccess(false);
      return;
    }

    if (!/^[0-9+\-\(\)\s]+$/.test(phone)) {
      setError("Invalid phone number");
      setSuccess(false);
      return;
    }

    const payload = {
      name,
      address,
      state,
      country,
      email,
      phone,
    };

    try {
      const response = await fetch("/api/invoice/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          responseData.error || `HTTP error! Status: ${response.status}`;
        setError(errorMessage);
        setSuccess(false);
        return;
      }

      setSuccess(true);
      setError(null);
      setName("");
      setAddress("");
      setState("");
      setEmail("");
      setPhone("");
      setOpen(false);
      onUserCreated?.({ ...payload, _id: responseData._id });
    } catch (error: any) {
      setError("Failed to create user: " + error.message);
      setSuccess(false);
    }
  };

  return (
    <div className="flex items-center gap-0">
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="bg-white text-black p-2 rounded-sm rounded-r-none w-[140px] font-semibold"
            onClick={() => {
              setSuccess(false);
              setError(null);
              setName("");
              setAddress("");
              setState("");
              setEmail("");
              setPhone("");
            }}
          >
            Create Customer
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select emirate
                  </option>
                  {uaeEmirates.map((emirate) => (
                    <option key={emirate} value={emirate}>
                      {emirate}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && (
                <p className="text-green-500 text-sm">
                  Customer created successfully!
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit}>
                  Create
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      {pathName.includes("customers") ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white text-black rounded-l-none w-10 h-10 flex items-center justify-center"
            >
              <ChevronDown className="h-4 w-4 !text-black" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href={`${getBasePath()}/customers`}>View Customers</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default CreateUserDialog;
