// InvoiceContextProvider.tsx
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
  UNIT_TYPES,
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
  downloadPdf: async (invoiceNumber: string): Promise<void> => Promise.resolve(),
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
        items: FORM_DEFAULT_VALUES.details.items.map((item) => ({
          ...item,
          unitType: item.unitType || "pcs", // Ensure default unitType
        })),
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
    reset(updatedDefaultValues);
    setInvoicePdf(new Blob());
    resetWizard();
    router.refresh();
    setNewInvoiceTrigger((prev) => prev + 1);
    newInvoiceSuccess();
  }, [reset, router, newInvoiceSuccess, resetWizard, updatedDefaultValues]);

  const downloadPdf = useCallback(
    async (invoiceNumber: string): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if (invoicePdf instanceof Blob && invoicePdf.size > 0) {
          try {
            const url = window.URL.createObjectURL(invoicePdf);
            const a = document.createElement("a");
            const numericInvoiceNumber = getNumericInvoiceNumber(invoiceNumber);
            const formValues = getValues();
            const isInvoice = formValues.details?.isInvoice || false;
            const hasTax = formValues.details?.taxDetails?.amount && formValues.details.taxDetails.amount > 0;

            let fileName = "";
            if (isInvoice && hasTax) {
              fileName = `SPC_TAX_INV_${numericInvoiceNumber}.pdf`;
            } else if (isInvoice && !hasTax) {
              fileName = `SPC_INV_${numericInvoiceNumber}.pdf`;
            } else {
              fileName = `SPC_QUT_${numericInvoiceNumber}.pdf`;
            }

            a.href = url;
            a.download = fileName;

            a.addEventListener('click', () => {
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
                resolve();
              }, 1000);
            });

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } catch (error) {
            console.error("Error downloading PDF:", error);
            resolve();
          }
        } else {
          resolve();
        }
      });
    },
    [invoicePdf, getValues, getNumericInvoiceNumber]
  );

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
              name: item.name || "No description provided",
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              unitType: item.unitType || "pcs", // Ensure unitType
              total: Number(item.quantity) * Number(item.unitPrice) || 0,
            })),
            taxDetails: {
              ...data.details.taxDetails,
              amount: Number(data.details.taxDetails?.amount) || 0,
              amountType: data.details.taxDetails?.amountType === "amount" ? "fixed" : data.details.taxDetails?.amountType || "percentage",
            },
          },
        };
        console.log("generatePdf payload:", payload.details.items);

        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        while (attempts < maxAttempts && !success) {
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
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.blob();
            if (result.size > 0) {
              setInvoicePdf(result);
              pdfGenerationSuccess();
              await downloadPdf(numericInvoiceNumber);
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

              success = true;
            }
          } catch (error) {
            attempts++;
            if (attempts === maxAttempts) {
              console.error("Failed to generate PDF after retries:", error);
              throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
          }
        }
      } finally {
        setInvoicePdfLoading(false);
        setTimeout(() => {
          newInvoice();
        }, 500);
      }
    },
    [pdfGenerationSuccess, downloadPdf, newInvoice]
  );

  const saveInvoice = useCallback(
    () => {
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
              items: formValues.details.items.map((item) => ({
                ...item,
                unitType: item.unitType || "pcs", // Ensure unitType
              })),
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
    },
    [getValues, savedInvoices, modifiedInvoiceSuccess, saveInvoiceSuccess]
  );

  const onFormSubmit = useCallback(
    (data: InvoiceType) => {
      if (!data?.details?.invoiceNumber) {
        console.error("Invoice number is required");
        return;
      }
      if (typeof data?.details?.pdfTemplate !== "number") {
        console.error("PDF template must be a number");
        return;
      }

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
            items: formValues.details.items.map((item) => ({
              ...item,
              unitType: item.unitType || "pcs", // Ensure unitType
            })),
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
              items: (importedData.details.items || []).map((item) => ({
                name: item.name || "No description provided",
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                unitType: item.unitType && UNIT_TYPES.includes(item.unitType) ? item.unitType : "pcs", // Validate unitType
                total: Number(item.quantity) * Number(item.unitPrice) || 0,
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