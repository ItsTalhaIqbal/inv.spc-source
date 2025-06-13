"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EyeIcon, Loader2, MoreHorizontal, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { isLogin } from "@/lib/Auth";
import { INVVariable, QUTVariable } from "@/lib/variables";

interface Invoice {
  _id?: string;
  invoiceNumber: string;
  sender: {
    name: string;
    address: string;
    state?: string;
    country: string;
    email: string;
    phone: string;
  };
  receiver: {
    name: string;
    address: string;
    state?: string;
    country: string;
    email: string;
    phone: string;
  };
  details: {
    isInvoice:boolean;
    invoiceLogo?: string;
    invoiceNumber: string;
    invoiceDate: Date | string;
    dueDate: Date | string;
    items: {
      name: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      _id?: string;
    }[];
    currency: string;
    language: string;
    taxDetails: {
      amount: number;
      amountType: "percentage" | "fixed";
      taxID: string;
    };
    discountDetails?: {
      amount?: number;
      amountType?: "percentage" | "fixed" | "amount";
    };
    shippingDetails?: {
      cost?: number;
      costType?: "percentage" | "fixed" | "amount";
    };
    paymentInformation: {
      bankName: string;
      accountName: string;
      accountNumber: string;
    };
    additionalNotes?: string;
    paymentTerms: string;
    signature?: {
      data: string;
    };
    subTotal: number;
    totalAmount: number;
    totalAmountInWords: string;
    pdfTemplate: number;
  };
  createdAt?: string | Date;
}

const Page: React.FC = () => {
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState<boolean>(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await isLogin();
        if (!user || user?.role !== "admin") {
          const isProduction = process.env.NODE_ENV === "production";
          const loginPath = isProduction ? "/en/login" : "/login";
          router.push(loginPath);
          return;
        }
        setAuthChecked(true);
        fetchInvoices();
      } catch (error) {
        console.error("Authentication error:", error);
        const isProduction = process.env.NODE_ENV === "production";
        const loginPath = isProduction ? "/en/login" : "/login";
        router.push(loginPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/invoice/new_invoice", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch invoices");
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const results = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.receiver.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(results);
  }, [searchTerm, invoices]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className={`h-8 w-8 animate-spin ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`} />
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"} transition-colors duration-300`}>
      <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by invoice number, sender, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className={`pl-10 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-300"}`}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className={`h-8 w-8 animate-spin ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`} />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className={`text-center text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-500"} mt-8`}>
          No invoices available
        </div>
      ) : (
        <Table className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} w-full`}>
          <TableHeader>
            <TableRow className={theme === "dark" ? "bg-gray-700" : "bg-gray-100"}>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>Invoice Number</TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>Customer</TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>Amount</TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>Date</TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice._id} className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}>
                <TableCell>{invoice.details?.isInvoice  ==true ? INVVariable : QUTVariable}{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.receiver.name}</TableCell>
                <TableCell>
                  {invoice.details.totalAmount} {invoice.details.currency}
                </TableCell>
                <TableCell>
                  {invoice?.createdAt
                    ? new Date(invoice.createdAt).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={theme === "dark" ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-200 text-black hover:bg-gray-300"}
                    onClick={() => {
                      setViewInvoiceDialog(true);
                      setViewInvoice(invoice);
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={viewInvoiceDialog} onOpenChange={setViewInvoiceDialog}>
        <DialogContent className={`${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-200"} max-w-3xl shadow-lg rounded-lg`}>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold">
              Invoice #{viewInvoice?.invoiceNumber}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              <strong>Created At:</strong>{" "}
              {viewInvoice?.createdAt
                ? new Date(viewInvoice.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </DialogHeader>
          {viewInvoice && (
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong>Invoice Number:</strong>{" "}
                    <span>{viewInvoice.invoiceNumber}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Invoice Date:</strong>{" "}
                    <span>{new Date(viewInvoice.details.invoiceDate).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Due Date:</strong>{" "}
                    <span>{new Date(viewInvoice.details.dueDate).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Currency:</strong>{" "}
                    <span>{viewInvoice.details.currency}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Sub Total:</strong>{" "}
                    <span>{viewInvoice.details.subTotal}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Total Amount in Words:</strong>{" "}
                    <span>{viewInvoice.details.totalAmountInWords}</span>
                  </p>
                </div>
              </div>
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Receiver Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong>Name:</strong>{" "}
                    <span>{viewInvoice.receiver.name}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Address:</strong>{" "}
                    <span>{viewInvoice.receiver.address}</span>
                  </p>
                  <p className="text-sm">
                    <strong>State:</strong>{" "}
                    <span>{viewInvoice.receiver.state || "N/A"}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Country:</strong>{" "}
                    <span>{viewInvoice.receiver.country}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong>{" "}
                    <span>{viewInvoice.receiver.email}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong>{" "}
                    <span>{viewInvoice.receiver.phone}</span>
                  </p>
                </div>
              </div>
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Items</h3>
                {viewInvoice.details.items.map((item, index) => (
                  <div
                    key={item._id || index}
                    className={theme === "dark" ? "border border-gray-600 p-3 rounded-md my-2 bg-gray-800" : "border border-gray-200 p-3 rounded-md my-2 bg-white"}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Name:</strong>{" "}
                        <span>{item.name}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Description:</strong>{" "}
                        <span>{item.description}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Quantity:</strong>{" "}
                        <span>{item.quantity}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Unit Price:</strong>{" "}
                        <span>{item.unitPrice}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Total:</strong>{" "}
                        <span className="font-medium">{item.total}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Tax, Discount & Shipping Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong>Tax Amount:</strong>{" "}
                    <span>{viewInvoice.details.taxDetails.amount}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Discount Amount:</strong>{" "}
                    <span>{viewInvoice.details.discountDetails?.amount || 0}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Shipping Cost:</strong>{" "}
                    <span>{viewInvoice.details.shippingDetails?.cost || 0}</span>
                  </p>
                </div>
              </div>
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong>Bank Name:</strong>{" "}
                    <span>{viewInvoice.details.paymentInformation.bankName}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Account Name:</strong>{" "}
                    <span>{viewInvoice.details.paymentInformation.accountName}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Account Number:</strong>{" "}
                    <span>{viewInvoice.details.paymentInformation.accountNumber}</span>
                  </p>
                </div>
              </div>
              <div className={theme === "dark" ? "bg-gray-700 p-4 rounded-md shadow-sm" : "bg-gray-50 p-4 rounded-md shadow-sm"}>
                <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong>Additional Notes:</strong>{" "}
                    <span>{viewInvoice.details.additionalNotes || "N/A"}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Payment Terms:</strong>{" "}
                    <span>{viewInvoice.details.paymentTerms}</span>
                  </p>
                  <p className="text-sm">
                    <strong>Signature:</strong>{" "}
                    <span>{viewInvoice.details.signature?.data ? "Present" : "N/A"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;