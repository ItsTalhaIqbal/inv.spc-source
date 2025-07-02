"use client";
import React, { useState, useEffect, useCallback } from "react";
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
import { INVVariable, QUTVariable, UNIT_TYPES } from "@/lib/variables";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { InvoiceType } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import Pagination from "@/components/Pagination";
import { DateRangePicker } from "@/components/DateFilter";

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
    pdfTemplate?: number;
    isInvoice: boolean;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    currency: string;
    language: string;
    items: {
      name: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      unitType: string;
      _id?: string;
    }[];
    taxDetails?: {
      amount: number;
      amountType: "percentage" | "fixed";
      taxID?: string;
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
  };
  createdAt?: string | Date;
}

interface DateRange {
  from: Date;
  to?: Date;
}

const Page: React.FC = () => {
  const { theme } = useTheme();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewInvoiceDialog, setViewInvoiceDialog] = useState<boolean>(false);
  const [editInvoiceDialog, setEditInvoiceDialog] = useState<boolean>(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const [editInvoice, setEditInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [pdfLoadingStates, setPdfLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [toast, setToast] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [convertInvoice, setConvertInvoice] = useState<any>(null);
  const [convertConfirm, setConvertConfirm] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const router = useRouter();

  const methods = useForm<InvoiceType>({
    defaultValues: {
      sender: {
        name: "SPC Source Technical Services LLC",
        address: "Iris Bay, Office D-43, Business Bay, Dubai, UAE",
        state: "Dubai",
        country: "UAE",
        email: "contact@spcsource.com",
        phone: "+971 54 500 4520",
      },
      receiver: {
        name: "",
        address: "",
        state: "",
        country: "",
        email: "",
        phone: "",
      },
      details: {
        pdfTemplate: 2,
        isInvoice: true,
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        currency: "AED",
        language: "en",
        items: [
          {
            name: "",
            description: "",
            quantity: 0,
            unitPrice: 0,
            total: 0,
            unitType: "",
          },
        ],
        taxDetails: { amount: 0, amountType: "percentage" },
        discountDetails: { amount: 0, amountType: "amount" },
        shippingDetails: { cost: 0, costType: "amount" },
        paymentInformation: {
          bankName: "Bank Inc.",
          accountName: "John Doe",
          accountNumber: "445566998877",
        },
        additionalNotes: "Received above items in good condition.",
        paymentTerms:
          "50% advance upon confirmation of the order, 50% upon delivery or completion.",
        subTotal: 0,
        totalAmount: 0,
        totalAmountInWords: "",
      },
    },
  });

  const { reset, handleSubmit, register, control, watch, setValue, getValues } =
    methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "details.items",
  });

  const [showTax, setShowTax] = useState<boolean>(false);
  const [showDiscount, setShowDiscount] = useState<boolean>(false);
  const [showShipping, setShowShipping] = useState<boolean>(false);
  const items = watch("details.items") || [];
  const taxDetails = watch("details.taxDetails");
  const discountDetails = watch("details.discountDetails");
  const shippingDetails = watch("details.shippingDetails");
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (filteredInvoices.length === 0 || totalPages === 0) {
      setCurrentPage(1);
    }
  }, [filteredInvoices, itemsPerPage, currentPage]);

  const subTotal = Number(
    items
      .reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
        0
      )
      .toFixed(2)
  );

  const taxAmount = Number(
    (showTax && taxDetails?.amount
      ? taxDetails.amountType === "percentage"
        ? subTotal * (taxDetails.amount / 100)
        : taxDetails.amount
      : 0
    ).toFixed(2)
  );

  const discountAmount = Number(
    (showDiscount && discountDetails?.amount
      ? discountDetails.amountType === "percentage"
        ? subTotal * (discountDetails.amount / 100)
        : discountDetails.amount
      : 0
    ).toFixed(2)
  );

  const shippingAmount = Number(
    (showShipping && shippingDetails?.cost
      ? shippingDetails.costType === "percentage"
        ? subTotal * (shippingDetails.cost / 100)
        : shippingDetails.cost
      : 0
    ).toFixed(2)
  );

  const totalAmount = Number(
    (
      subTotal +
      (showTax ? taxAmount : 0) +
      (showShipping ? shippingAmount : 0) -
      (showDiscount ? discountAmount : 0)
    ).toFixed(2)
  );

  const numberToWords = (num: number): string => {
    if (isNaN(num) || num === 0) return "Zero Dirham";
    const units = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];
    const thousands = ["", "thousand", "million", "billion"];

    const convertLessThanOneThousand = (n: number): string => {
      if (n === 0) return "";
      if (n < 10) return units[n];
      if (n < 20) return teens[n - 10];
      const tensPart = Math.floor(n / 10);
      const unitsPart = n % 10;
      return (
        tens[tensPart] +
        (unitsPart !== 0 ? (tensPart > 0 ? "-" : "") + units[unitsPart] : "")
      );
    };

    const convert = (n: number): string => {
      if (n === 0) return "zero";
      let words = "";
      let i = 0;
      while (n > 0) {
        const chunk = n % 1000;
        if (chunk > 0) {
          const chunkWords = convertLessThanOneThousand(chunk);
          words =
            chunkWords +
            (i > 0 ? ` ${thousands[i]}` : "") +
            (words ? " " + words : "");
        }
        n = Math.floor(n / 1000);
        i++;
      }
      return words.trim();
    };

    const [integerPart, decimalPart] = Number(num).toFixed(2).split(".");
    const integerNum = parseInt(integerPart);
    const decimalNum = parseInt(decimalPart);

    let result = convert(integerNum);
    result += ` ${methods.getValues("details.currency") || "Dirham"}`;
    if (decimalNum > 0) {
      result += ` and ${convert(decimalNum)} Fils`;
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  useEffect(() => {
    const subscription = watch((value: any, { name }) => {
      if (
        name &&
        (name.startsWith("details.items") ||
          name.startsWith("details.taxDetails") ||
          name.startsWith("details.discountDetails") ||
          name.startsWith("details.shippingDetails"))
      ) {
        if (
          name.startsWith("details.items") &&
          (name.includes("quantity") || name.includes("unitPrice"))
        ) {
          const index = parseInt(name.split(".")[2]);
          const quantity = value.details?.items?.[index].quantity || 0;
          const unitPrice = value.details?.items?.[index].unitPrice || 0;
          const newTotal = Number((quantity * unitPrice).toFixed(2));
          const currentTotal = getValues(`details.items.${index}.total`);
          if (newTotal !== currentTotal) {
            setValue(`details.items.${index}.total`, newTotal, {
              shouldValidate: true,
            });
          }
        }
      }
    });

    if (!showTax) {
      setValue("details.taxDetails.amount", 0);
    }
    if (!showDiscount) {
      setValue("details.discountDetails.amount", 0);
    }
    if (!showShipping) {
      setValue("details.shippingDetails.cost", 0);
    }

    const currentTotalAmount =
      subTotal +
      (showTax ? taxAmount : 0) +
      (showShipping ? shippingAmount : 0) -
      (showDiscount ? discountAmount : 0);

    const newTotalAmountInWords = numberToWords(currentTotalAmount);

    setValue("details.subTotal", subTotal, {
      shouldValidate: true,
      shouldDirty: false,
    });

    setValue("details.totalAmount", currentTotalAmount, {
      shouldValidate: true,
      shouldDirty: false,
    });

    setValue("details.totalAmountInWords", newTotalAmountInWords, {
      shouldValidate: true,
      shouldDirty: false,
    });

    return () => subscription.unsubscribe();
  }, [
    watch,
    setValue,
    getValues,
    subTotal,
    taxAmount,
    discountAmount,
    shippingAmount,
    showTax,
    showDiscount,
    showShipping,
  ]);

  const mapInvoiceToFormData = (invoice: Invoice): InvoiceType => {
    const invoiceDate =
      typeof invoice.details?.invoiceDate === "string"
        ? invoice.details.invoiceDate.split("T")[0]
        : new Date(invoice.details?.invoiceDate).toISOString().split("T")[0];

    const dueDate = invoice.details?.dueDate
      ? typeof invoice.details.dueDate === "string"
        ? invoice.details.dueDate.split("T")[0]
        : new Date(invoice.details.dueDate).toISOString().split("T")[0]
      : "";

    return {
      sender: {
        name: invoice.sender?.name || "SPC Source Technical Services LLC",
        address:
          invoice.sender?.address ||
          "Iris Bay, Office D-43, Business Bay, Dubai, UAE",
        state: invoice.sender?.state || "Dubai",
        country: invoice.sender?.country || "UAE",
        email: invoice.sender?.email || "contact@spcsource.com",
        phone: invoice.sender?.phone || "+971 54 500 4520",
      },
      receiver: {
        name: invoice.receiver?.name || "",
        address: invoice.receiver?.address || "",
        state: invoice.receiver?.state || "",
        country: invoice.receiver?.country || "",
        email: invoice.receiver?.email || "",
        phone: invoice.receiver?.phone || "",
      },
      details: {
        pdfTemplate: invoice.details?.pdfTemplate || 2,
        isInvoice: invoice.details?.isInvoice || false,
        invoiceNumber: invoice.details?.invoiceNumber || "",
        invoiceDate,
        dueDate,
        currency: invoice.details?.currency || "AED",
        language: invoice.details?.language || "en",
        items:
          invoice.details?.items?.length > 0
            ? invoice.details.items.map((item) => ({
                name: item.name || "",
                description: item.description || "",
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                total: Number(item.total) || 0,
                unitType:
                  item.unitType && UNIT_TYPES.includes(item.unitType)
                    ? item.unitType
                    : "",
              }))
            : [
                {
                  name: "",
                  description: "",
                  quantity: 0,
                  unitPrice: 0,
                  total: 0,
                  unitType: "",
                },
              ],
        taxDetails: {
          amount: Number(invoice.details?.taxDetails?.amount) || 0,
          amountType: invoice.details?.taxDetails?.amountType || "percentage",
          taxID: invoice.details?.taxDetails?.taxID || "",
        },
        discountDetails: {
          amount: Number(invoice.details?.discountDetails?.amount) || 0,
          amountType: invoice.details?.discountDetails?.amountType || "amount",
        },
        shippingDetails: {
          cost: Number(invoice.details?.shippingDetails?.cost) || 0,
          costType: invoice.details?.shippingDetails?.costType || "amount",
        },
        paymentInformation: {
          bankName:
            invoice.details?.paymentInformation?.bankName || "Bank Inc.",
          accountName:
            invoice.details?.paymentInformation?.accountName || "John Doe",
          accountNumber:
            invoice.details?.paymentInformation?.accountNumber ||
            "445566998877",
        },
        additionalNotes:
          invoice.details?.additionalNotes ||
          "Received above items in good condition.",
        paymentTerms:
          invoice.details?.paymentTerms ||
          "50% advance upon confirmation of the order, 50% upon delivery or completion.",
        signature: invoice.details?.signature || undefined,
        subTotal: Number(invoice.details?.subTotal) || 0,
        totalAmount: Number(invoice.details?.totalAmount) || 0,
        totalAmountInWords: invoice.details?.totalAmountInWords || "",
      },
    };
  };

  const onGeneratePdf = async (invoice: Invoice) => {
    const formData = mapInvoiceToFormData(invoice);
    reset(formData);

    try {
      setPdfLoadingStates((prev) => ({ ...prev, [invoice._id!]: true }));
      const response = await fetch("/api/invoice/get_new_pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Custom-Request": "invoice-pdf",
        },
        body: JSON.stringify({ action: "generate", invoiceData: formData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const blob = await response.blob();
      const numericInvoiceNumber = formData.details.invoiceNumber.replace(
        /\D/g,
        ""
      );
      const isInvoice = formData.details.isInvoice || false;
      const taxAmount = formData.details.taxDetails?.amount || 0;

      let fileName = "";
      if (isInvoice && taxAmount) {
        fileName = `SPC_TAX_INV_${numericInvoiceNumber}.pdf`;
      } else if (isInvoice && !taxAmount) {
        fileName = `SPC_INV_${numericInvoiceNumber}.pdf`;
      } else {
        fileName = `SPC_QUT_${numericInvoiceNumber}.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setToast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      setToast({
        title: "Error",
        description: `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setPdfLoadingStates((prev) => ({ ...prev, [invoice._id!]: false }));
    }
  };

 const onEditInvoice = (invoice: Invoice) => {
  const formData = mapInvoiceToFormData(invoice);
  reset(formData);
  setEditInvoice(invoice);
  setEditInvoiceDialog(true);
  setShowTax(
    !!invoice.details.taxDetails?.amount && invoice.details.taxDetails.amount > 0
  );
  setShowDiscount(!!invoice.details.discountDetails?.amount);
  setShowShipping(!!invoice.details.shippingDetails?.cost);
  // Set dueDate value based on invoice data
  setValue("details.dueDate", formData.details.dueDate || "", {
    shouldValidate: true,
  });
  setErrorMessage("");
};

  const onSubmitEdit = async (data: InvoiceType) => {
    if (!editInvoice?._id) return;

    setIsSaving(true);
    try {
      setErrorMessage("");
      const calculatedTotal =
        subTotal +
        (showTax ? taxAmount : 0) +
        (showShipping ? shippingAmount : 0) -
        (showDiscount ? discountAmount : 0);

      const invoiceDate = new Date(data?.details?.invoiceDate as any);
      const dueDate = data.details.dueDate
        ? new Date(data.details.dueDate)
        : null;

      if (dueDate && dueDate < invoiceDate) {
        setErrorMessage("Due date cannot be before the invoice date.");
        setIsSaving(false);
        return;
      }

      if (calculatedTotal < 0) {
        setErrorMessage(
          "Total amount cannot be negative. Please adjust the discount or other amounts."
        );
        setIsSaving(false);
        return;
      }
      if (calculatedTotal === 0) {
        setErrorMessage("Total amount cannot be zero (0).");
        setIsSaving(false);
        return;
      }
      const hasEmptyName = data.details.items.some(
        (item: any) => !item.name.trim()
      );
      if (hasEmptyName) {
        setErrorMessage("Item name is required.");
        setIsSaving(false);
        return;
      }

      const maxDiscount =
        subTotal +
        (showTax ? taxAmount : 0) +
        (showShipping ? shippingAmount : 0);
      if (
        showDiscount &&
        discountDetails?.amount &&
        discountAmount > maxDiscount
      ) {
        setErrorMessage(`Discount cannot exceed ${maxDiscount.toFixed(2)}.`);
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/invoice/new_invoice", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          _id: editInvoice._id,
          invoiceNumber: editInvoice.invoiceNumber,
          details: {
            ...data.details,
            pdfTemplate: data.details.pdfTemplate || 2,
            currency: data.details.currency || "AED",
            language: data.details.language || "en",
            taxDetails: showTax
              ? data.details.taxDetails
              : { amount: 0, amountType: "percentage" },
            discountDetails: showDiscount
              ? data.details.discountDetails
              : { amount: 0, amountType: "amount" },
            shippingDetails: showShipping
              ? data.details.shippingDetails
              : { cost: 0, costType: "amount" },
            subTotal: Number(subTotal.toFixed(2)),
            totalAmount: Number(calculatedTotal.toFixed(2)),
            totalAmountInWords: numberToWords(calculatedTotal),
            items: data.details.items.map((item) => ({
              ...item,
              name: item.name.trim(),
            })),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }

      setEditInvoiceDialog(false);
      fetchInvoices();
      setToast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update invoice"
      );
    } finally {
      setIsSaving(false);
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

      const sortedInvoices = data.sort((a: Invoice, b: Invoice) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : Number.MIN_SAFE_INTEGER;
        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : Number.MIN_SAFE_INTEGER;
        return dateB - dateA;
      });

      setInvoices(sortedInvoices);
      setFilteredInvoices(sortedInvoices);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch invoices",
      });
      setInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = useCallback(() => {
    return invoices.filter((invoice) => {
      // Search filter
      const matchesSearch =
        invoice.details.invoiceNumber
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.receiver.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        invoice.receiver.phone.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType =
        filterType === "all" ||
        (filterType === "invoices" && invoice.details.isInvoice) ||
        (filterType === "quotations" && !invoice.details.isInvoice);

      // Date filter - completely rewritten
      let matchesDate = true;
      if (dateRange?.from) {
        try {
          // Safely parse invoice date
          const invoiceDate = invoice.createdAt
            ? new Date(invoice.createdAt)
            : null;

          if (!invoiceDate || isNaN(invoiceDate.getTime())) {
            console.warn(
              `Invalid date for invoice ${invoice._id}`,
              invoice.createdAt
            );
            return false;
          }

          // Create comparison dates (normalized to start/end of day)
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);

          const toDate = dateRange.to ? new Date(dateRange.to) : new Date();
          toDate.setHours(23, 59, 59, 999);

          matchesDate = invoiceDate >= fromDate && invoiceDate <= toDate;
        } catch (error) {
          console.error("Date parsing error:", error);
          return false;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [invoices, searchTerm, filterType, dateRange]);

  useEffect(() => {
    const filtered = filterInvoices();
    setFilteredInvoices(filtered);

    // Reset to first page if results change
    setCurrentPage(1);
  }, [filterInvoices]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleDateRangeChange = (values: { range: DateRange }) => {
    console.log("New date range selected:", values.range);
    setDateRange(values.range);
  };

  const handleConvert = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/invoice/next-number");
      const { data } = res;
      const invNumber = data.invoiceNumber.replace(/^QUT-/, "");

      const {
        _id,
        createdAt: oldCreatedAt,
        ...invoiceWithoutId
      } = convertInvoice || {};
      const payload = {
        ...invoiceWithoutId,
        invoiceNumber: invNumber,
        details: {
          ...invoiceWithoutId?.details,
          invoiceNumber: invNumber,
          isInvoice: true,
        },
        createdAt: new Date().toISOString(),
      };

      const response = await axios.post("/api/invoice/new_invoice", payload);

      if (response.status === 200 || response.status === 201) {
        setToast({
          title: "Success",
          description: "Quotation converted to invoice successfully",
        });
        setEditInvoice(undefined);
        setEditInvoiceDialog(false);
        setConvertConfirm(false);
        setCurrentPage(1);
        await fetchInvoices();
      }
    } catch (error) {
      console.error("Error converting quotation to invoice:", error);
      setToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to convert quotation",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2
          className={`h-8 w-8 animate-spin ${
            theme === "dark" ? "text-gray-300" : "text-gray-500"
          }`}
        />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <ToastProvider>
        <div
          className={`p-6 w-6xl mt-4 mx-[250px] min-h-[850px] h-auto ${
            theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
          } transition-colors duration-300`}
        >
          <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>

          <div className="flex items-center justify-between mb-4">
            <div className="relative w-64 gap-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by invoice number or sender name..."
                value={searchTerm}
                onChange={handleSearch}
                className={`pl-10 ${
                  theme === "dark"
                    ? "bg-gray-800 text-white border-gray-700"
                    : "bg-white text-black border-gray-300"
                }`}
              />
            </div>
            <div className="flex items-center gap-4">
              <DateRangePicker
                onUpdate={handleDateRangeChange}
                initialDateFrom={
                  new Date(new Date().setDate(new Date().getDate() - 30))
                }
                initialDateTo={new Date()}
                showCompare={false}
                align="end"
                locale="en-US"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`${
                      theme === "dark"
                        ? "bg-gray-800 text-white border-gray-700"
                        : "bg-white text-black border-gray-300"
                    } w-[100px]`}
                  >
                    {filterType === "all"
                      ? "All"
                      : filterType === "invoices"
                      ? "Invoices"
                      : "Quotations"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType("all")}>
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("invoices")}>
                    Invoices
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType("quotations")}>
                    Quotations
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2
                className={`h-8 w-8 animate-spin ${
                  theme === "dark" ? "text-gray-300" : "text-gray-500"
                }`}
              />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div
              className={`text-start mt-4 text-xl ${
                theme === "dark" ? "text-gray-300" : "text-gray-500"
              } mt-8`}
            >
              No {filterType === "all" ? "invoices or quotations" : filterType}{" "}
              available
            </div>
          ) : (
            <Table
              className={`${
                theme === "dark"
                  ? "bg-gray-800 text-white"
                  : "bg-white text-black"
              } w-full `}
            >
              <TableHeader>
                <TableRow
                  className={theme === "dark" ? "bg-gray-700" : "bg-gray-100"}
                >
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Invoice Number
                  </TableHead>
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Customer
                  </TableHead>
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Phone
                  </TableHead>
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Amount
                  </TableHead>
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Date
                  </TableHead>
                  <TableHead
                    className={theme === "dark" ? "text-white" : "text-black"}
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentInvoices.map((invoice) => (
                  <TableRow
                    key={invoice._id}
                    className={
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-50"
                    }
                  >
                    <TableCell>
                      {invoice.details?.isInvoice ? INVVariable : QUTVariable}
                      {invoice.details.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.receiver.name}</TableCell>
                    <TableCell>{invoice.receiver.phone}</TableCell>
                    <TableCell>
                      {Number(invoice.details.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {invoice?.createdAt
                        ? new Date(invoice.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Invoice</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download PDF</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
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
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Invoice</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Pagination
            totalItems={filteredInvoices.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />

          <Dialog open={viewInvoiceDialog} onOpenChange={setViewInvoiceDialog}>
            <DialogContent
              className={`${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-200"
              } max-w-3xl shadow-lg rounded-lg`}
            >
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-2xl font-bold">
                  {viewInvoice?.details.isInvoice == true
                    ? "Invoice #"
                    : "Quotation #"}
                  {viewInvoice?.details.invoiceNumber}
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
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
                    }
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Invoice Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Invoice Number:</strong>{" "}
                        <span>{viewInvoice.invoiceNumber}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Invoice Date:</strong>{" "}
                        <span>
                          {new Date(
                            viewInvoice.details.invoiceDate
                          ).toLocaleDateString()}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Due Date:</strong>{" "}
                        <span>
                          {viewInvoice.details.dueDate
                            ? new Date(
                                viewInvoice.details.dueDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Currency:</strong>{" "}
                        <span>{viewInvoice.details.currency}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Sub Total:</strong>{" "}
                        <span>
                          {Number(viewInvoice.details.subTotal).toFixed(2)}
                        </span>
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
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
                    }
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Receiver Information
                    </h3>
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
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
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
                          <p className="text-sm whitespace-pre-line">
                            <strong>Name:</strong> <span>{item.name}</span>
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
                            <span>{Number(item.unitPrice).toFixed(2)}</span>
                          </p>
                          <p className="text-sm">
                            <strong>Unit Type:</strong>{" "}
                            <span>{item.unitType || "None"}</span>
                          </p>
                          <p className="text-sm">
                            <strong>Total:</strong>{" "}
                            <span className="font-medium">
                              {Number(item.total).toFixed(2)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className={
                      theme === "dark"
                        ? "bg-gray-700 p-4 rounded-md shadow-sm"
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
                    }
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Tax, Discount & Shipping Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Tax Amount:</strong>{" "}
                        <span>
                          {viewInvoice.details.taxDetails?.amount
                            ? Number(
                                viewInvoice.details.taxDetails.amount
                              ).toFixed(2)
                            : "0.00"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Discount Amount:</strong>{" "}
                        <span>
                          {viewInvoice.details.discountDetails?.amount
                            ? Number(
                                viewInvoice.details.discountDetails.amount
                              ).toFixed(2)
                            : "0.00"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Shipping Cost:</strong>{" "}
                        <span>
                          {viewInvoice.details.shippingDetails?.cost
                            ? " border-gray-200 p-3 rounded-md my-2 bg-white"
                            : "border border-gray-600 p-3 rounded-md my-2 bg-gray-800"}

                          {Number(
                            viewInvoice?.details?.shippingDetails?.cost
                          ).toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    className={
                      theme === "dark"
                        ? "bg-gray-700 p-4 rounded-md shadow-sm"
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
                    }
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Bank Name:</strong>{" "}
                        <span>
                          {viewInvoice.details.paymentInformation?.bankName}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Account Name:</strong>{" "}
                        <span>
                          {viewInvoice.details.paymentInformation?.accountName}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Account Number:</strong>{" "}
                        <span>
                          {
                            viewInvoice.details.paymentInformation
                              ?.accountNumber
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                  <div
                    className={
                      theme === "dark"
                        ? "bg-gray-700 p-4 rounded-md shadow-sm"
                        : "bg-gray-200 p-4 rounded-md shadow-sm"
                    }
                  >
                    <h3 className="text-lg font-semibold mb-2">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <p className="text-sm">
                        <strong>Additional Notes:</strong>{" "}
                        <span>
                          {viewInvoice.details.additionalNotes || "N/A"}
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Payment Terms:</strong>{" "}
                        <span>{viewInvoice.details.paymentTerms}</span>
                      </p>
                      <p className="text-sm">
                        <strong>Signature:</strong>{" "}
                        <span>
                          {viewInvoice.details.signature?.data
                            ? "Present"
                            : "N/A"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={editInvoiceDialog} onOpenChange={setEditInvoiceDialog}>
            <DialogContent
              className={`${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-200 focus:outline-none"
              } sm:max-w-[800px] shadow-lg rounded-md`}
            >
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-lg font-bold flex justify-between mt-6">
                  {editInvoice?.details.isInvoice == true
                    ? "Invoice #"
                    : "Quotation #"}
                  {editInvoice?.details.invoiceNumber}
                  {editInvoice?.details.isInvoice == false ? (
                    <Button
                      onClick={() => {
                        setConvertInvoice(editInvoice);
                        setConvertConfirm(true);
                      }}
                      disabled={loading}
                    >
                      Convert Into Invoice
                    </Button>
                  ) : null}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmitEdit)}>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-6">
                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">Invoice Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Invoice Type
                          </label>
                          <select
                            {...register("details.isInvoice")}
                            className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          >
                            <option value="true">Invoice</option>
                            <option value="false">Quotation</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Invoice Date
                          </label>
                          <Input
                            type="date"
                            {...register("details.invoiceDate")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            {...register("details.dueDate")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">
                        Receiver Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input
                            {...register("receiver.name")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <Input
                            type="email"
                            {...register("receiver.email")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Phone</label>
                          <Input
                            {...register("receiver.phone")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Address</label>
                          <Input
                            {...register("receiver.address")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">State</label>
                          <Input
                            {...register("receiver.state")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Country</label>
                          <Input
                            {...register("receiver.country")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">Items</h3>
                      {fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="border border-gray-400 p-4 rounded-md space-y-2"
                        >
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Name
                              </label>
                              <textarea
                                {...register(`details.items.${index}.name`, {
                                  required: "Item name is required",
                                })}
                                className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 resize-y h-[50px] text-left ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-white text-black border-gray-300"
                                }`}
                                placeholder="Item Name"
                                rows={2}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Unit Type
                              </label>
                              <select
                                {...register(
                                  `details.items.${index}.unitType`,
                                  {
                                    validate: (value) =>
                                      value === "" ||
                                      UNIT_TYPES.includes(value as any) ||
                                      "Please select a valid unit type",
                                  }
                                )}
                                className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-white text-black border-gray-300"
                                }`}
                              >
                                <option value="">Select Unit</option>
                                {UNIT_TYPES.map((unit) => (
                                  <option key={unit} value={unit}>
                                    {unit || "None"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Quantity
                              </label>
                              <Input
                                type="number"
                                step="1"
                                {...register(
                                  `details.items.${index}.quantity`,
                                  {
                                    valueAsNumber: true,
                                    min: {
                                      value: 0,
                                      message: "Quantity cannot be negative",
                                    },
                                  }
                                )}
                                className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-white text-black border-gray-300"
                                }`}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  const value = e.target.value;
                                  const parsedValue =
                                    value === ""
                                      ? 0
                                      : parseInt(value.replace(/^0+/, ""));
                                  setValue(
                                    `details.items.${index}.quantity`,
                                    parsedValue,
                                    { shouldValidate: true }
                                  );
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">
                                Unit Price
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                {...register(
                                  `details.items.${index}.unitPrice`,
                                  {
                                    valueAsNumber: true,
                                    min: {
                                      value: 0,
                                      message: "Unit price cannot be negative",
                                    },
                                  }
                                )}
                                className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-white text-black border-gray-300"
                                }`}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  const value = e.target.value;
                                  const parsedValue =
                                    value === ""
                                      ? 0
                                      : parseFloat(value.replace(/^0+/, ""));
                                  setValue(
                                    `details.items.${index}.unitPrice`,
                                    parsedValue,
                                    { shouldValidate: true }
                                  );
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">
                                Description
                              </label>
                              <textarea
                                {...register(
                                  `details.items.${index}.description`
                                )}
                                className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 resize-y h-[50px] text-left ${
                                  theme === "dark"
                                    ? "bg-gray-700 text-white border-gray-600"
                                    : "bg-white text-black border-gray-300"
                                }`}
                                placeholder="Item Description"
                                rows={2}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                Remove Item
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() =>
                          append({
                            name: "",
                            description: "",
                            quantity: 0,
                            unitPrice: 0,
                            total: 0,
                            unitType: "",
                          })
                        }
                        className="mt-2"
                      >
                        Add Item
                      </Button>
                    </div>

                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">
                        Tax, Discount & Shipping
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="tax-switch"
                          checked={showTax}
                          onCheckedChange={setShowTax}
                        />
                        <Label htmlFor="tax-switch">Add Tax</Label>
                      </div>
                      {showTax && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">
                              Tax Amount
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register("details.taxDetails.amount", {
                                valueAsNumber: true,
                                min: {
                                  value: 0,
                                  message: "Tax amount cannot be negative",
                                },
                              })}
                              className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Amount Type
                            </label>
                            <select
                              {...register("details.taxDetails.amountType")}
                              className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Tax ID
                            </label>
                            <Input
                              {...register("details.taxDetails.taxID")}
                              className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="discount-switch"
                          checked={showDiscount}
                          onCheckedChange={setShowDiscount}
                        />
                        <Label htmlFor="discount-switch">Add Discount</Label>
                      </div>
                      {showDiscount && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">
                              Discount Amount
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register("details.discountDetails.amount", {
                                valueAsNumber: true,
                                min: {
                                  value: 0,
                                  message: "Discount amount cannot be negative",
                                },
                              })}
                              className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Amount Type
                            </label>
                            <select
                              {...register(
                                "details.discountDetails.amountType"
                              )}
                              className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            >
                              <option value="percentage">Percentage</option>
                              <option value="amount">Fixed</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="shipping-switch"
                          checked={showShipping}
                          onCheckedChange={setShowShipping}
                        />
                        <Label htmlFor="shipping-switch">Add Shipping</Label>
                      </div>
                      {showShipping && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">
                              Shipping Cost
                            </label>
                            <Input
                              type="number"
                              step="0.01"
                              {...register("details.shippingDetails.cost", {
                                valueAsNumber: true,
                                min: {
                                  value: 0,
                                  message: "Shipping cost cannot be negative",
                                },
                              })}
                              className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Cost Type
                            </label>
                            <select
                              {...register("details.shippingDetails.costType")}
                              className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 ${
                                theme === "dark"
                                  ? "bg-gray-700 text-white border-gray-600"
                                  : "bg-white text-black border-gray-300"
                              }`}
                            >
                              <option value="percentage">Percentage</option>
                              <option value="amount">Fixed</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">
                        Payment Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Bank Name
                          </label>
                          <Input
                            {...register("details.paymentInformation.bankName")}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Account Name
                          </label>
                          <Input
                            {...register(
                              "details.paymentInformation.accountName"
                            )}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Account Number
                          </label>
                          <Input
                            {...register(
                              "details.paymentInformation.accountNumber"
                            )}
                            className={`mt-1 focus:ring-2 focus:ring-blue-500 ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className={`space-y-4 p-4 rounded-lg ${
                        theme === "dark" ? "bg-gray-800/50" : "bg-gray-200"
                      }`}
                    >
                      <h3 className="text-lg font-semibold">
                        Additional Information
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="text-sm font-medium">
                            Additional Notes
                          </label>
                          <textarea
                            {...register("details.additionalNotes")}
                            className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 resize-y h-[100px] ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                            placeholder="Additional Notes"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Payment Terms
                          </label>
                          <textarea
                            {...register("details.paymentTerms")}
                            className={`mt-1 w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 resize-y h-[100px] ${
                              theme === "dark"
                                ? "bg-gray-700 text-white border-gray-600"
                                : "bg-white text-black border-gray-300"
                            }`}
                            placeholder="Payment Terms"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                {errorMessage && (
                  <div className="text-red-500 text-sm mt-2">
                    {errorMessage}
                  </div>
                )}
                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditInvoiceDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={convertConfirm} onOpenChange={setConvertConfirm}>
            <DialogContent
              className={`${
                theme === "dark"
                  ? "bg-gray-800 text-white border-gray-700"
                  : "bg-white text-black border-gray-200"
              }`}
            >
              <DialogHeader>
                <DialogTitle>Confirm Conversion</DialogTitle>
              </DialogHeader>
              <p>
                Are you sure you want to convert Quotation #
                {convertInvoice?.details.invoiceNumber} to an Invoice?
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConvertConfirm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleConvert} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {toast && (
            <Toast>
              <div className="grid gap-2">
                <ToastTitle>{toast.title}</ToastTitle>
                <ToastDescription>{toast.description}</ToastDescription>
              </div>
              <ToastClose />
            </Toast>
          )}
          <ToastViewport />
        </div>
      </ToastProvider>
    </FormProvider>
  );
};

export default Page;
