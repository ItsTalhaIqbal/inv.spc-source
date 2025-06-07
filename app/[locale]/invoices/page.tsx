"use client";

import React, { useState, useEffect } from "react";
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
  const [viewInvoice, setViewInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await isLogin();

        if (!user || user?.role !== "admin") {
          router.push("/login");
          return;
        }

        setAuthChecked(true);
        fetchInvoices();
      } catch (error) {
        console.error("Authentication error:", error);
        router.push("/login");
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
      alert(
        error instanceof Error ? error.message : "Failed to fetch invoices"
      );
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const results = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.receiver.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(results);
  }, [searchTerm, invoices]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!authChecked || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by invoice number, sender, or email..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      <Table className="bg-slate-900">
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.map((invoice) => (
            <TableRow key={invoice._id}>
              <TableCell>{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.receiver.name}</TableCell>

              <TableCell>
                {invoice.details.totalAmount} {invoice.details.currency}
              </TableCell>
              <TableCell>
                {" "}
                {invoice?.createdAt
                  ? new Date(invoice.createdAt).toLocaleDateString()
                  : "N/A"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-slate-300 text-black"
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

      <Dialog open={viewInvoiceDialog} onOpenChange={setViewInvoiceDialog}>
        <DialogContent className="max-w-3xl bg-white shadow-lg rounded-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Invoice #{viewInvoice?.invoiceNumber}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              <strong>Created At:</strong>{" "}
              {viewInvoice?.createdAt
                ? new Date(viewInvoice.createdAt).toLocaleString()
                : "N/A"}
            </p>
          </DialogHeader>
          {viewInvoice && (
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Invoice Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong className="text-gray-700">Invoice Number:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.invoiceNumber}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Invoice Date:</strong>{" "}
                    <span className="text-gray-600">
                      {new Date(
                        viewInvoice.details.invoiceDate
                      ).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Due Date:</strong>{" "}
                    <span className="text-gray-600">
                      {new Date(
                        viewInvoice.details.dueDate
                      ).toLocaleDateString()}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Currency:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.currency}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Sub Total:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.subTotal}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">
                      Total Amount in Words:
                    </strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.totalAmountInWords}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Receiver Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong className="text-gray-700">Name:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.name}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Address:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.address}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">State:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.state || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Country:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.country}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Email:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.email}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Phone:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.receiver.phone}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Items
                </h3>
                {viewInvoice.details.items.map((item, index) => (
                  <div
                    key={item._id || index}
                    className="border border-gray-200 p-3 rounded-md my-2 bg-white"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong className="text-gray-700">Name:</strong>{" "}
                        <span className="text-gray-600">{item.name}</span>
                      </p>
                      <p className="text-sm">
                        <strong className="text-gray-700">Description:</strong>{" "}
                        <span className="text-gray-600">
                          {item.description}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong className="text-gray-700">Quantity:</strong>{" "}
                        <span className="text-gray-600">{item.quantity}</span>
                      </p>
                      <p className="text-sm">
                        <strong className="text-gray-700">Unit Price:</strong>{" "}
                        <span className="text-gray-600">{item.unitPrice}</span>
                      </p>
                      <p className="text-sm">
                        <strong className="text-gray-700">Total:</strong>{" "}
                        <span className="text-gray-600 font-medium">
                          {item.total}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Tax, Discount & Shipping Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong className="text-gray-700">Tax Amount:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.taxDetails.amount}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Discount Amount:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.discountDetails?.amount || 0}
                    </span>
                  </p>

                  <p className="text-sm">
                    <strong className="text-gray-700">Shipping Cost:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.shippingDetails?.cost || 0}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong className="text-gray-700">Bank Name:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.paymentInformation.bankName}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Account Name:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.paymentInformation.accountName}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Account Number:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.paymentInformation.accountNumber}
                    </span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Additional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">
                    <strong className="text-gray-700">Additional Notes:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.additionalNotes || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Payment Terms:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.paymentTerms}
                    </span>
                  </p>
                  <p className="text-sm">
                    <strong className="text-gray-700">Signature:</strong>{" "}
                    <span className="text-gray-600">
                      {viewInvoice.details.signature?.data ? "Present" : "N/A"}
                    </span>
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
