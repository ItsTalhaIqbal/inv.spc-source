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
import { useFormContext } from "react-hook-form";
import useToasts from "@/hooks/useToasts";
import { exportInvoice } from "@/services/invoice/client/exportInvoice";
import {
  FORM_DEFAULT_VALUES,
  SEND_PDF_API,
  SHORT_DATE_OPTIONS,
} from "@/lib/variables";
import { ExportTypes, InvoiceType } from "@/types";

const defaultInvoiceContext = {
  invoicePdf: new Blob(),
  invoicePdfLoading: false,
  savedInvoices: [] as InvoiceType[],
  pdfUrl: null as string | null,
  onFormSubmit: (values: InvoiceType) => {},
  newInvoice: () => {},
  newInvoiceTrigger: 0,
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
  currentWizardStep: 0,
  setCurrentWizardStep: (step: number) => {},
  resetWizard: () => {},
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
  const { getValues, reset } = useFormContext<InvoiceType>();
  const {
    newInvoiceSuccess,
    pdfGenerationSuccess,
    saveInvoiceSuccess,
    modifiedInvoiceSuccess,
    sendPdfError,
    importInvoiceError,
  } = useToasts();

  const [invoicePdf, setInvoicePdf] = useState<Blob>(new Blob());
  const [invoicePdfLoading, setInvoicePdfLoading] = useState<boolean>(false);
  const [savedInvoices, setSavedInvoices] = useState<InvoiceType[]>([]);
  const [newInvoiceTrigger, setNewInvoiceTrigger] = useState<number>(0);
  const [currentWizardStep, setCurrentWizardStep] = useState<number>(0);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);

  const getNumericInvoiceNumber = (invoiceNumber: string | undefined): string => {
    if (!invoiceNumber) return "";
    return invoiceNumber.replace(/\D/g, "");
  };

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

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        try {
          window.URL.revokeObjectURL(pdfUrl);
        } catch (error) {}
      }
    };
  }, [pdfUrl]);

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

  useEffect(() => {
    try {
      reset(updatedDefaultValues);
    } catch (error) {}
  }, [reset, updatedDefaultValues]);

  const resetWizard = useCallback(() => {
    try {
      setCurrentWizardStep(0);
    } catch (error) {
      console.error("Error resetting wizard:", error);
    }
  }, []);

  const newInvoice = useCallback(() => {
    try {
      reset(FORM_DEFAULT_VALUES);
      setInvoicePdf(new Blob());
      resetWizard();
      router.refresh();
      setNewInvoiceTrigger((prev) => prev + 1);
      newInvoiceSuccess();
    } catch (error) {
      console.error("Error creating new invoice:", error);
    }
  }, [reset, router, newInvoiceSuccess, resetWizard]);

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
        setDownloadComplete(true); // Mark download as complete
      } catch (error) {}
    }
  }, [invoicePdf, getValues]);

  const generatePdf = useCallback(
    async (data: InvoiceType) => {
      if (!data) {
        return;
      }
      setInvoicePdfLoading(true);
      const numericInvoiceNumber = getNumericInvoiceNumber(data.details.invoiceNumber);
      const payload = {
        invoiceNumber: data.details.invoiceNumber || "",
        sender: data.sender,
        receiver: data.receiver || { name: "", address: "", state: "", country: "UAE" },
        details: {
          ...data.details,
          invoiceNumber: data.details.invoiceNumber || "",
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

            // Initiate download
            downloadPdf();

            // Save the invoice to the server (optional, based on your needs)
            try {
              const savePayload = {
                ...payload,
                invoiceNumber: numericInvoiceNumber,
                details: {
                  ...payload.details,
                  invoiceNumber: numericInvoiceNumber,
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
                console.error("Failed to save invoice to server");
              }
            } catch (error: any) {
              console.error("Error saving invoice to server:", error);
            }
          }
          break;
        } catch (error: any) {
          attempts++;
          if (attempts === maxAttempts) {
            console.error("Max attempts reached for generating PDF");
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        } finally {
          setInvoicePdfLoading(false);
        }
      }
    },
    [pdfGenerationSuccess, downloadPdf]
  );

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
        } catch (error) {}
      }
    } catch (error) {}
  }, [getValues, savedInvoices, modifiedInvoiceSuccess, saveInvoiceSuccess]);

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

  const removeFinalPdf = useCallback(() => {
    try {
      setInvoicePdf(new Blob());
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {}
  }, [pdfUrl]);

  const previewPdfInTab = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const url = window.URL.createObjectURL(invoicePdf);
        const newWindow = window.open(url, "_blank");
        if (!newWindow) {}
      } catch (error) {}
    }
  }, [invoicePdf]);

  const printPdf = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const pdfUrl = window.URL.createObjectURL(invoicePdf);
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            try {
              printWindow.print();
            } catch (error) {}
          };
        }
      } catch (error) {}
    }
  }, [invoicePdf]);

  const deleteInvoice = useCallback(
    (index: number) => {
      try {
        if (index >= 0 && index < savedInvoices.length) {
          const updatedInvoices = [...savedInvoices];
          updatedInvoices.splice(index, 1);
          setSavedInvoices(updatedInvoices);
          try {
            localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
          } catch (error) {}
        }
      } catch (error) {}
    },
    [savedInvoices]
  );

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
      } catch (error) {}
    },
    [getValues]
  );

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

  // Optional: Automatically trigger new invoice after download (with delay)
  useEffect(() => {
    if (downloadComplete) {
      const timer = setTimeout(() => {
        newInvoice();
        setDownloadComplete(false); // Reset after triggering
      }, 2000); // 2-second delay to ensure download starts
      return () => clearTimeout(timer);
    }
  }, [downloadComplete, newInvoice]);

  return (
    <InvoiceContext.Provider
      value={{
        invoicePdf,
        invoicePdfLoading,
        savedInvoices,
        pdfUrl,
        onFormSubmit,
        newInvoice,
        newInvoiceTrigger,
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
        currentWizardStep,
        setCurrentWizardStep,
        resetWizard,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
};

export default InvoiceContextProvider;