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
  downloadPdf: async (): Promise<void> => {},
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
          }
        }
      }
    } catch (error) {
      console.error("Error loading saved invoices:", error);
    }
  }, []);

  const pdfUrl = useMemo(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        return window.URL.createObjectURL(invoicePdf);
      } catch (error) {
        return null;
      }
    }
    return null;
  }, [invoicePdf]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
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
    reset(updatedDefaultValues);
  }, [reset, updatedDefaultValues]);

  const resetWizard = useCallback(() => {
    setCurrentWizardStep(0);
  }, []);

  const newInvoice = useCallback(() => {
    reset(FORM_DEFAULT_VALUES);
    setInvoicePdf(new Blob());
    resetWizard();
    router.refresh();
    setNewInvoiceTrigger((prev) => prev + 1);
    newInvoiceSuccess();
  }, [reset, router, newInvoiceSuccess, resetWizard]);

  const downloadPdf = useCallback(async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
        try {
          const url = window.URL.createObjectURL(invoicePdf);
          const a = document.createElement("a");
          const originalInvoiceNumber = getValues().details.invoiceNumber || "unknown";
          a.href = url;
          a.download = `invoice_${originalInvoiceNumber}.pdf`;

          a.addEventListener('click', () => {
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
              resolve();
            }, 100);
          });

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (error) {
          console.error("Error downloading PDF:", error);
          reject(error);
        }
      } else {
        reject(new Error("No valid PDF available"));
      }
    });
  }, [invoicePdf, getValues]);

  const generatePdf = useCallback(
    async (data: InvoiceType) => {
      if (!data) return;

      setInvoicePdfLoading(true);
      try {
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

        console.log("Sending payload to /api/invoice/generate:", JSON.stringify(payload, null, 2));

        const response = await fetch("/api/invoice/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Custom-Request": "invoice-pdf",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(60000),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }

        const result = await response.blob();
        if (result.size === 0) {
          throw new Error("Empty PDF blob received");
        }

        setInvoicePdf(result);
        pdfGenerationSuccess();
        await downloadPdf();

        try {
          await fetch("/api/invoice/new_invoice", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...payload,
              invoiceNumber: numericInvoiceNumber,
              details: {
                ...payload.details,
                invoiceNumber: numericInvoiceNumber,
              },
            }),
          });
        } catch (error) {
          console.error("Failed to save invoice to server:", error);
        }
      } catch (error) {
        console.error("PDF generation failed:", error);
        throw error;
      } finally {
        setInvoicePdfLoading(false);
      }
    },
    [pdfGenerationSuccess, downloadPdf]
  );

  const saveInvoice = useCallback(() => {
    try {
      if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
        const formValues = getValues();
        if (!formValues?.details?.invoiceNumber) return;

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
          (invoice) => invoice.details.invoiceNumber === numericInvoiceNumber
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
        localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
  }, [getValues, savedInvoices, modifiedInvoiceSuccess, saveInvoiceSuccess]);

  const onFormSubmit = useCallback(
    (data: InvoiceType) => {
      if (!data?.details?.invoiceNumber) return;
      if (typeof data?.details?.pdfTemplate !== "number") return;

      generatePdf(data);
      saveInvoice();
    },
    [generatePdf, saveInvoice]
  );

  const removeFinalPdf = useCallback(() => {
    setInvoicePdf(new Blob());
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
  }, [pdfUrl]);

  const previewPdfInTab = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const url = window.URL.createObjectURL(invoicePdf);
        window.open(url, "_blank");
      } catch (error) {
        console.error("Error opening PDF preview:", error);
      }
    }
  }, [invoicePdf]);

  const printPdf = useCallback(() => {
    if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
      try {
        const pdfUrl = window.URL.createObjectURL(invoicePdf);
        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } catch (error) {
        console.error("Error printing PDF:", error);
      }
    }
  }, [invoicePdf]);

  const deleteInvoice = useCallback(
    (index: number) => {
      if (index >= 0 && index < savedInvoices.length) {
        const updatedInvoices = [...savedInvoices];
        updatedInvoices.splice(index, 1);
        setSavedInvoices(updatedInvoices);
        localStorage.setItem("savedInvoices", JSON.stringify(updatedInvoices));
      }
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
          if (response.ok) return;
          throw new Error(`HTTP error! Status: ${response.status}`);
        } catch (error) {
          attempts++;
          if (attempts === maxAttempts) {
            sendPdfError({ email, sendPdfToMail });
            throw error;
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
        if (!formValues?.details?.invoiceNumber) return;

        const numericInvoiceNumber = getNumericInvoiceNumber(formValues.details.invoiceNumber);
        exportInvoice(exportAs, {
          ...formValues,
          details: {
            ...formValues.details,
            invoiceNumber: numericInvoiceNumber,
          },
        });
      } catch (error) {
        console.error("Error exporting invoice:", error);
      }
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
          if (typeof result !== "string") return;

          const importedData = JSON.parse(result) as InvoiceType;
          if (!importedData?.details) return;

          const sanitizedData = {
            ...importedData,
            details: {
              ...importedData.details,
              invoiceNumber: importedData.details.invoiceNumber || "UNKNOWN",
              currency: "AED",
              invoiceDate: importedData.details.invoiceDate
                ? new Date(importedData.details.invoiceDate).toISOString()
                : new Date().toISOString(),
              items: (importedData.details.items || []).map((item:any) => ({
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
      reader.onerror = importInvoiceError;
      reader.readAsText(file);
    },
    [reset, importInvoiceError]
  );

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