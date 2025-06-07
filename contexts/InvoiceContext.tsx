"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

// RHF
import { useFormContext } from "react-hook-form";

// Hooks
import useToasts from "@/hooks/useToasts";

// Services
import { exportInvoice } from "@/services/invoice/client/exportInvoice";

// Variables
import {
  FORM_DEFAULT_VALUES,
  SEND_PDF_API,
  SHORT_DATE_OPTIONS,
} from "@/lib/variables";

// Types
import { ExportTypes, InvoiceType } from "@/types";

const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as InvoiceType[],
  pdfUrl: null as string | null,
  onFormSubmit: (values: InvoiceType) => {},
  newInvoice: () => {},
  generatePdf: async (data: InvoiceType) => {},
  removeFinalPdf: () => {},
  downloadPdf: () => {},
  printPdf: () => {},
  previewPdfInTab: () => {},
  saveInvoice: () => {},
  deleteInvoice: (index: number) => {},
  sendPdfToMail: async (email: string): Promise<void> => Promise.resolve(),
  exportInvoiceAs: (exportAs: ExportTypes) => {},
  importInvoice: (file: File) => {},
};

export const InvoiceContext = createContext(defaultInvoiceContext);

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoiceContext must be used within an InvoiceContextProvider");
  }
  return context;
};

type InvoiceContextProviderProps = {
  children: React.ReactNode;
};

export const InvoiceContextProvider = ({
  children,
}: InvoiceContextProviderProps) => {
  const router = useRouter();

  // Toasts
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfError,
    importInvoiceError,
  } = useToasts();

  // Get form values and methods from form context
  const { getValues, reset } = useFormContext<InvoiceType>();

  // Variables
  const [invoicePdf, setInvoicePdf] = useState<Blob>(new Blob());
  const [invoicePdfLoading, setInvoicePdfLoading] = useState<boolean>(false);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceType[]>([]);

  // Helper function to extract numeric part of invoiceNumber
  const getNumericInvoiceNumber = (invoiceNumber: string | undefined): string => {
    if (!invoiceNumber) return "";
    return invoiceNumber.replace(/\D/g, ""); // Remove all non-digits
  };

  // Load saved invoices from local storage
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedInvoicesJSON = window.localStorage.getItem("savedInvoices");
        if (savedInvoicesJSON) {
          const parsedInvoices = JSON.parse(savedInvoicesJSON);
          if (Array.isArray(parsedInvoices)) {
            setSavedInvoices(parsedInvoices);
          } else {
            setSavedInvoices([]);
          }
        }
      }
    } catch (error) {
      setSavedInvoices([]);
    }
  }, []);

  // Generate PDF URL
  const pdfUrl = useMemo(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const url = window.URL.createObjectURL(invoicePdf);
        return url;
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [invoicePdf]);

  // Cleanup PDF URL on component unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        try {
          window.URL.revokeObjectURL(pdfUrl);
        } catch (error) {
        }
      }
    };
  }, [pdfUrl]);

  // Default form values
  const updatedDefaultValues = useMemo(
    () => ({
      ...FORM_DEFAULT_VALUES,
      details: {
        ...FORM_DEFAULT_VALUES.details,
        currency: "AED",
      },
    }),
    []
  );

  // Reset form with default values
  useEffect(() => {
    try {
      reset(updatedDefaultValues);
    } catch (error) {
    }
  }, [reset, updatedDefaultValues]);

  // Save invoice
  const saveInvoice = useCallback(() => {
    try {
      if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
        const formValues = getValues();
        if (!formValues?.details?.invoiceNumber) {
          return;
        }

        const updatedDate = new Date().toLocaleDateString("en-US", SHORT_DATE_OPTIONS);
        const numericInvoiceNumber = getNumericInvoiceNumber(formValues.details.invoiceNumber);
        const updatedFormValues = {
          ...formValues,
          details: {
            ...formValues.details,
            invoiceNumber: numericInvoiceNumber,
            updatedAt: updatedDate,
          },
        };

        const existingInvoiceIndex = savedInvoices.findIndex(
          (invoice: InvoiceType) => invoice.details.invoiceNumber === numericInvoiceNumber
        );

        let updatedInvoices = [...savedInvoices];
        if (existingInvoiceIndex !== -1) {
          updatedInvoices[existingInvoiceIndex] = updatedFormValues;
          modifiedInvoiceSuccess();
        } else {
          updatedInvoices.push(updatedFormValues);
          saveInvoiceSuccess();
        }

        setSavedInvoices(updatedInvoices);
        try {
          localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
        } catch (error) {
        }
      } else {
      }
    } catch (error) {
    }
  }, [getValues, savedInvoices, modifiedInvoiceSuccess, saveInvoiceSuccess]);

  // Generate PDF with retry logic
  const generatePdf = useCallback(async (data: InvoiceType) => {
    if (!data) {
      return;
    }
    setInvoicePdfLoading(true);
    const numericInvoiceNumber = getNumericInvoiceNumber(data.details.invoiceNumber);
    const payload = {
      invoiceNumber: data.details.invoiceNumber || "", // Keep original for PDF
      sender: data.sender,
      receiver: data.receiver || { name: "", address: "", state: "", country: "UAE" },
      details: {
        ...data.details,
        invoiceNumber: data.details.invoiceNumber || "", // Keep original for PDF
        currency: "AED",
        items: (data.details.items || []).map((item) => ({
          ...item,
          description: item.description || "No description provided",
          unitPrice: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 0,
        })),
        taxDetails: {
          ...data.details.taxDetails,
          amount: Number(data.details.taxDetails?.amount) || 0,
          amountType: data.details.taxDetails?.amountType === "amount" ? "fixed" : data.details.taxDetails?.amountType || "percentage",
        },
      },
    };

    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        const response = await fetch("/api/invoice/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Custom-Request": "invoice-pdf",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} - ${await response.text()}`);
        }

        const result = await response.blob();
        if (result.size > 0) {
          setInvoicePdf(result);
          pdfGenerationSuccess();

          // Save to database
          try {
            const savePayload = {
              ...payload,
              invoiceNumber: numericInvoiceNumber, // Numeric for DB
              details: {
                ...payload.details,
                invoiceNumber: numericInvoiceNumber, // Numeric for DB
              },
            };
            const saveResponse = await fetch("/api/invoice/new_invoice", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(savePayload),
              signal: AbortSignal.timeout(10000),
            });
            if (!saveResponse.ok) {
            } else {
            }
          } catch (error: any) {
          }
        } else {
        }
        break;
      } catch (error: any) {
        attempts++;
        if (attempts === maxAttempts) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      } finally {
        setInvoicePdfLoading(false);
      }
    }
  }, [pdfGenerationSuccess]);

  // Form submission handler
  const onFormSubmit = useCallback(
    (data: InvoiceType) => {
      if (!data?.details?.invoiceNumber) {
        return;
      }
      if (typeof data?.details?.pdfTemplate !== "number") {
        return;
      }
      generatePdf(data);
      saveInvoice();
    },
    [generatePdf, saveInvoice]
  );

  // Remove final PDF
  const removeFinalPdf = useCallback(() => {
    try {
      setInvoicePdf(new Blob());
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
    }
  }, [pdfUrl]);

  // Preview PDF in new tab
  const previewPdfInTab = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const url = window.URL.createObjectURL(invoicePdf);
        const newWindow = window.open(url, "_blank");
        if (!newWindow) {
        }
      } catch (error) {
      }
    } else {
    }
  }, [invoicePdf]);

  // Download PDF
  const downloadPdf = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const url = window.URL.createObjectURL(invoicePdf);
        const a = document.createElement("a");
        const originalInvoiceNumber = getValues().details.invoiceNumber || "unknown";
        a.href = url;
        a.download = `invoice_${originalInvoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
      }
    } else {
    }
  }, [invoicePdf, getValues]);

  // Print PDF
  const printPdf = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const pdfUrl = window.URL.createObjectURL(invoicePdf);
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
            } catch (error) {
            }
          };
        } else {
        }
      } catch (error) {
      }
    } else {
    }
  }, [invoicePdf]);

  // Delete invoice
  const deleteInvoice = useCallback(
    (index: number) => {
      try {
        if (index >= 0 && index < savedInvoices.length) {
          const updatedInvoices = [...savedInvoices];
          updatedInvoices.splice(index, 1);
          setSavedInvoices(updatedInvoices);
          try {
            localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
          } catch (error) {
          }
        } else {
        }
      } catch (error) {
      }
    },
    [savedInvoices]
  );

  // Send PDF to email
  const sendPdfToMail = useCallback(
    async (email: string): Promise<void> => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        sendPdfError({ email, sendPdfToMail });
        return;
      }
      if (!(invoicePdf instanceof Blob) || invoicePdf.size === 0) {
        sendPdfError({ email, sendPdfToMail });
        return;
      }

      const originalInvoiceNumber = getValues().details.invoiceNumber || "unknown";
      const numericInvoiceNumber = getNumericInvoiceNumber(getValues().details.invoiceNumber);
      const fd = new FormData();
      fd.append("email", email);
      fd.append("invoicePdf", invoicePdf, `invoice_${originalInvoiceNumber}.pdf`);
      fd.append("invoiceNumber", numericInvoiceNumber);

      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(SEND_PDF_API, {
            method: "POST",
            body: fd,
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) {
            return;
          } else {
            throw new Error(`HTTP error! Status: ${response.status} - ${await response.text()}`);
          }
        } catch (error: any) {
          attempts++;
          if (attempts === maxAttempts) {
            sendPdfError({ email, sendPdfToMail });
            throw new Error("Max attempts reached for sending PDF");
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    },
    [invoicePdf, getValues, sendPdfError]
  );

  // Export invoice
  const exportInvoiceAs = useCallback(
    (exportAs: ExportTypes) => {
      try {
        const formValues = getValues();
        if (!formValues?.details?.invoiceNumber) {
          return;
        }
        const numericInvoiceNumber = getNumericInvoiceNumber(formValues.details.invoiceNumber);
        const updatedFormValues = {
          ...formValues,
          details: {
            ...formValues.details,
            invoiceNumber: numericInvoiceNumber,
          },
        };
        exportInvoice(exportAs, updatedFormValues);
      } catch (error) {
      }
    },
    [getValues]
  );

  // Import invoice
  const importInvoice = useCallback(
    (file: File) => {
      if (!file || file.type !== "application/json") {
        importInvoiceError();
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result !== "string") {
            throw new Error("FileReader result is not a string");
          }
          const importedData = JSON.parse(result) as InvoiceType;
          if (!importedData?.details) {
            throw new Error("Invalid invoice data: Missing details");
          }

          // Sanitize imported data
          const sanitizedData: any = {
            ...importedData,
            details: {
              ...importedData.details,
              invoiceNumber: importedData.details.invoiceNumber || "UNKNOWN",
              currency: "AED",
              invoiceDate: importedData.details.invoiceDate
                ? new Date(importedData.details.invoiceDate)
                : new Date(),
              dueDate: importedData.details.dueDate
                ? new Date(importedData.details.dueDate)
                : new Date(),
              items: (importedData.details.items || []).map((item) => ({
                ...item,
                description: item.description || "No description provided",
                unitPrice: Number(item.unitPrice) || 0,
                quantity: Number(item.quantity) || 0,
              })),
            },
          };

          reset(sanitizedData);
        } catch (error) {
          importInvoiceError();
        }
      };
      reader.onerror = () => {
        importInvoiceError();
      };
      reader.readAsText(file);
    },
    [reset, importInvoiceError]
  );

  // Create new invoice
  const newInvoice = useCallback(() => {
    try {
      reset(FORM_DEFAULT_VALUES);
      setInvoicePdf(new Blob());
      router.refresh();
      newInvoiceSuccess();
    } catch (error) {
    }
  }, [reset, router, newInvoiceSuccess]);

  return (
    <InvoiceContext.Provider
      value={{
        invoicePdf,
        invoicePdfLoading,
        savedInvoices,
        pdfUrl,
        onFormSubmit,
        newInvoice,
        generatePdf,
        removeFinalPdf,
        downloadPdf,
        printPdf,
        previewPdfInTab,
        saveInvoice,
        deleteInvoice,
        sendPdfToMail,
        exportInvoiceAs,
        importInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export default InvoiceContextProvider;