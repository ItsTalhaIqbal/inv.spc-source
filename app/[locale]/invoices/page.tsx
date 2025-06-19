"use client"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EyeIcon, DownloadIcon, Loader2, Search, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { isLogin } from "@/lib/Auth";
import { INVVariable, QUTVariable } from "@/lib/variables";
import { useForm, FormProvider } from "react-hook-form";
import { InvoiceType } from "@/types";

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
    isInvoice: boolean;
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
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState<boolean>(false);
  const [editInvoiceDialog, setEditInvoiceDialog] = useState<boolean>(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | undefined>(undefined);
  const [editInvoice, setEditInvoice] = useState<Invoice | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [pdfLoadingStates, setPdfLoadingStates] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();
  const methods = useForm<InvoiceType>();
  const { reset, handleSubmit } = methods;

  const mapInvoiceToFormData = (invoice: Invoice): InvoiceType => {
    return {
      sender: {
        name: invoice.sender.name || "SPC Source Technical Services LLC",
        address: invoice.sender.address || "Iris Bay, Office D-43, Business Bay, Dubai, UAE.",
        state: invoice.sender.state || "Dubai",
        country: invoice.sender.country || "UAE",
        email: invoice.sender.email || "contact@spcsource.com",
        phone: invoice.sender.phone || "+971 54 500 4520",
      },
      receiver: {
        name: invoice.receiver.name || "",
        address: invoice.receiver.address || "",
        state: invoice.receiver.state || "",
        country: invoice.receiver.country || "",
        email: invoice.receiver.email || "",
        phone: invoice.receiver.phone || "",
      },
      details: {
        isInvoice: invoice.details.isInvoice || false,
        invoiceLogo: invoice.details.invoiceLogo || "/public/assets/img/image.jpg",
        invoiceNumber: invoice.details.invoiceNumber || "",
        invoiceDate:
          typeof invoice.details.invoiceDate === "string"
            ? invoice.details.invoiceDate
            : invoice.details.invoiceDate?.toISOString() || new Date().toISOString(),
        dueDate:
          typeof invoice.details.dueDate === "string"
            ? invoice.details.dueDate
            : invoice.details.dueDate?.toISOString() || new Date().toISOString(),
        items: invoice.details.items.length > 0
          ? invoice.details.items.map((item) => ({
              name: item.name || "",
              description: item.description || "",
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              total: Number(item.total) || 0,
            }))
          : [{ name: "", quantity: 0, unitPrice: 0, total: 0 }],
        currency: invoice.details.currency || "AED",
        language: invoice.details.language || "English",
        taxDetails: {
          amount: Number(invoice.details.taxDetails?.amount) || 0,
          amountType: invoice.details.taxDetails?.amountType || "amount",
          taxID: invoice.details.taxDetails?.taxID || "",
        },
        discountDetails: {
          amount: Number(invoice.details.discountDetails?.amount) || 0,
          amountType: invoice.details.discountDetails?.amountType || "amount",
        },
        shippingDetails: {
          cost: Number(invoice.details.shippingDetails?.cost) || 0,
          costType: invoice.details.shippingDetails?.costType || "amount",
        },
        paymentInformation: {
          bankName: invoice.details.paymentInformation?.bankName || "Bank Inc.",
          accountName: invoice.details.paymentInformation?.accountName || "John Doe",
          accountNumber: invoice.details.paymentInformation?.accountNumber || "445566998877",
        },
        additionalNotes: invoice.details.additionalNotes || "Received above items in good condition.",
        paymentTerms: invoice.details.paymentTerms || "50% advance upon confirmation of the order, 50% upon delivery or completion.",
        signature: invoice.details.signature || undefined,
        subTotal: Number(invoice.details.subTotal) || 0,
        totalAmount: Number(invoice.details.totalAmount) || 0,
        totalAmountInWords: invoice.details.totalAmountInWords || "",
        pdfTemplate: Number(invoice.details.pdfTemplate) || 2,
      },
    };
  };

  const onGeneratePdf = async (invoice: Invoice) => {
    const formData = mapInvoiceToFormData(invoice);
    reset(formData);

    try {
      setPdfLoadingStates(prev => ({ ...prev, [invoice._id!]: true }));
      console.log("Generating PDF for invoice:", formData.details.invoiceNumber);
      const response = await fetch("/api/invoice/get_new_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Request": "invoice-pdf",
        },
        body: JSON.stringify({ action: "generate", invoiceData: formData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const blob = await response.blob();
      const numericInvoiceNumber = formData.details.invoiceNumber.replace(/\D/g, "");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${numericInvoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setPdfLoadingStates(prev => ({ ...prev, [invoice._id!]: false }));
    }
  };

  const onEditInvoice = (invoice: Invoice) => {
    const formData = mapInvoiceToFormData(invoice);
    reset(formData);
    setEditInvoice(invoice);
    setEditInvoiceDialog(true);
  };

  const onSubmitEdit = async (data: InvoiceType) => {
    if (!editInvoice?._id) return;

    try {
      const response = await fetch("/api/invoice/new_invoice", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          _id: editInvoice._id,
          invoiceNumber: data.details.invoiceNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setEditInvoiceDialog(false);
      fetchInvoices();
      alert("Invoice updated successfully");
    } catch (error) {
      console.error("Error updating invoice:", error);
      alert(`Failed to update invoice: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

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
        <Loader2
          className={`h-8 w-8 animate-spin ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
        />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div
        className={`p-6 max-w-6xl mx-auto ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"} transition-colors duration-300`}
      >
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
            <Loader2
              className={`h-8 w-8 animate-spin ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}
            />
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
                <TableRow
                  key={invoice._id}
                  className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                >
                  <TableCell>
                    {invoice.details?.isInvoice ? INVVariable : QUTVariable}
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.receiver.name}</TableCell>
                  <TableCell>
                    {invoice.details.totalAmount} {invoice.details.currency}
                  </TableCell>
                  <TableCell>
                    {invoice?.createdAt
                      ? new Date(invoice.createdAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        theme === "dark"
                          ? "bg-gray-600 text-white hover:bg-gray-500"
                          : "bg-gray-200 text-black hover:bg-gray-300"
                      }
                      onClick={() => {
                        setViewInvoiceDialog(true);
                        setViewInvoice(invoice);
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        theme === "dark"
                          ? "bg-gray-600 text-white hover:bg-gray-500"
                          : "bg-gray-200 text-black hover:bg-gray-300"
                      }
                      onClick={() => onGeneratePdf(invoice)}
                      disabled={pdfLoadingStates[invoice._id!]}
                    >
                      {pdfLoadingStates[invoice._id!] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <DownloadIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        theme === "dark"
                          ? "bg-gray-600 text-white hover:bg-gray-500"
                          : "bg-gray-200 text-black hover:bg-gray-300"
                      }
                      onClick={() => onEditInvoice(invoice)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* View Invoice Dialog */}
        <Dialog open={viewInvoiceDialog} onOpenChange={setViewInvoiceDialog}>
          <DialogContent
            className={`${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-200"} max-w-3xl shadow-lg rounded-lg`}
          >
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold">
                Invoice #{viewInvoice?.invoiceNumber}
              </DialogTitle>
              <div className="flex items-center justify-between mb-4 gap-4">
                <p className="text-sm text-gray-500">
                  <strong>Created At:</strong>{" "}
                  {viewInvoice?.createdAt
                    ? new Date(viewInvoice.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </DialogHeader>
            {viewInvoice && (
              <div className="max-h-[70vh] overflow-y-auto p-4 space-y-6">
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
                  <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <p className="text-sm">
                      <strong>Invoice Number:</strong>{" "}
                      <span>{viewInvoice.invoiceNumber}</span>
                    </p>
                    <p className="text-sm">
                      <strong>Invoice Date:</strong>{" "}
                      <span>
                        {new Date(viewInvoice.details.invoiceDate).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      <strong>Due Date:</strong>{" "}
                      <span>
                        {new Date(viewInvoice.details.dueDate).toLocaleDateString()}
                      </span>
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
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
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
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
                  <h3 className="text-lg font-semibold mb-2">Items</h3>
                  {viewInvoice.details.items.map((item, index) => (
                    <div
                      key={item._id || index}
                      className={
                        theme === "dark"
                          ? "border border-gray-600 p-3 rounded-md my-2 bg-gray-800"
                          : "border border-gray-200 p-3 rounded-md my-2 bg-white"
                      }
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm">
                          <strong>Name:</strong> <span>{item.name}</span>
                        </p>
                        <p className="text-sm">
                          <strong>Description:</strong>{" "}
                          <span>{item.description}</span>
                        </p>
                        <p className="text-sm">
                          <strong>Quantity:</strong> <span>{item.quantity}</span>
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
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
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
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
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
                <div
                  className={
                    theme === "dark"
                      ? "bg-gray-700 p-4 rounded-md shadow-sm"
                      : "bg-gray-50 p-4 rounded-md shadow-sm"
                  }
                >
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

        {/* Edit Invoice Dialog */}
        <Dialog open={editInvoiceDialog} onOpenChange={setEditInvoiceDialog}>
          <DialogContent
            className={`${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white text-black border-gray-200"} max-w-3xl shadow-lg rounded-lg`}
          >
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl font-bold">
                Edit Invoice #{editInvoice?.invoiceNumber}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6 p-4">
              <div>
                <label className="text-sm font-medium">Invoice Number</label>
                <Input {...methods.register("details.invoiceNumber")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Sender Name</label>
                <Input {...methods.register("sender.name")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Receiver Name</label>
                <Input {...methods.register("receiver.name")} className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Total Amount</label>
                <Input {...methods.register("details.totalAmount")} type="number" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <Input {...methods.register("details.currency")} className="mt-1" />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditInvoiceDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </FormProvider>
  );
};

export default Page;
