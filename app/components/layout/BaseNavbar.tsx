"use client";

import { useMemo, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

// Next
import Link from "next/link";

// ShadCn
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Moon, Sun, FileText, Contact, Lock, Plus } from "lucide-react";

// Components
import {
  DevDebug,
  LanguageSelector,
  NewInvoiceAlert,
  BaseButton,
} from "@/app/components";
import { logOut } from "@/lib/Auth";
import { getBasePath } from "@/lib/utils";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";
import { useInvoiceContext } from "@/contexts/InvoiceContext";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <BaseButton
      tooltipLabel="Switch Theme"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative w-8 h-8 flex items-center justify-center p-1.5 rounded-full ${
        theme === "dark"
          ? "bg-gray-700 text-white hover:bg-gray-600"
          : "bg-gray-200 text-black hover:bg-gray-300"
      }`}
    >
      <span className="relative w-full h-full">
        <Sun
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            theme === "dark"
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-0"
          }`}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </BaseButton>
  );
};

const BaseNavbar = () => {
  const { resolvedTheme } = useTheme();
  const { _t } = useTranslationContext();
  const { invoicePdfLoading } = useInvoiceContext();
  const devEnv = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);

  const pathname = usePathname();
  const router = useRouter()
  // Prevent rendering until theme is resolved
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Avoid rendering until theme is ready
  }

  if (pathname?.includes("/login")) {
    return null;
  }
   const isProduction = process.env.NODE_ENV === "production";
        const homePath = isProduction ? "/en/" : "/";

  return (
    <header className="lg:container z-[99]">
      <nav>
        <Card
          className={`flex flex-wrap justify-between items-center px-5 gap-5 ${
            resolvedTheme === "dark"
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-200"
          } transition-colors duration-300`}
        >
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center p-4">
              <div className="flex flex-col ml-2">
                <span className="text-2xl font-semibold">SPC</span>
                <span className="text-md font-semibold">Source</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <BaseButton
              tooltipLabel="Invoices"
              variant="ghost"
              size="icon"
              asChild
              className={`relative w-8 h-8 flex items-center justify-center p-1.5 rounded-full ${
                resolvedTheme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              <Link href={`${getBasePath()}/invoices`} aria-label="Invoices">
                <FileText className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </BaseButton>
            <BaseButton
              tooltipLabel="Cusotmers"
              variant="ghost"
              size="icon"
              asChild
              className={`relative w-8 h-8 flex items-center justify-center p-1.5 rounded-full ${
                resolvedTheme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }`}
            >
              <Link href={`${getBasePath()}/customers`} aria-label="Customers">
                <Contact className="h-[1.2rem] w-[1.2rem]" />
              </Link>
            </BaseButton>
            <NewInvoiceAlert>
              <Link href={homePath}>
              <BaseButton
                variant="ghost"
                size="icon"
                tooltipLabel="Get a new invoice form"
                disabled={invoicePdfLoading}
                className={`relative w-8 h-8 flex items-center justify-center p-1.5 rounded-full ${
                  resolvedTheme === "dark"
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
                aria-label="New Invoice"
              >
                <Plus className="h-[1.2rem] w-[1.2rem]" />
              </BaseButton>
              </Link>
            </NewInvoiceAlert>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`relative w-8 h-8 flex items-center justify-center p-1.5 rounded-full ${
                    resolvedTheme === "dark"
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={`w-40 ${
                  resolvedTheme === "dark"
                    ? "bg-gray-800 text-white border-gray-700"
                    : "bg-white text-black border-gray-200"
                }`}
              >
                <DropdownMenuItem
                  asChild
                  className={
                    resolvedTheme === "dark"
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }
                >
                  <Link
                    href={`${getBasePath()}/change-password`}
                    className="w-full text-center"
                  >
                    Change Password
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className={
                    resolvedTheme === "dark"
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-100"
                  }
                >
                  <Link
                    href={`${getBasePath()}/login`}
                    onClick={() => logOut()}
                    className="w-full text-center"
                  >
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeSwitcher />
            {/* {devEnv && (
              <>
                <DevDebug />
                <LanguageSelector />
              </>
            )} */}
          </div>
        </Card>
      </nav>
    </header>
  );
};

export default BaseNavbar;
