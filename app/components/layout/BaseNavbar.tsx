"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

// Next
import Link from "next/link";
import Image from "next/image";

// Assets
import Logo from "@/public/assets/img/invoify-logo.svg";

// ShadCn
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

// Components
import { DevDebug, LanguageSelector, ThemeSwitcher } from "@/app/components";
import { logOut } from "@/lib/Auth";
import { getBasePath } from "@/lib/utils";

const BaseNavbar = () => {
  const devEnv = useMemo(() => {
    return process.env.NODE_ENV === "development";
  }, []);

  const pathname = usePathname();

  if (pathname?.includes("/login")) {
    return null;
  }

  return (
    <header className="lg:container z-[99]">
      <nav>
        <Card className="flex flex-wrap justify-between items-center px-5 gap-5">
          <Link href={"/"} className="flex flex-col p-4">
            <span className="text-2xl font-semibold">SPC </span>
            <span className="text-md mt-0 font-semibold"> Source</span>
          </Link>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-gray-900"
                >
                  <User className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                {" "}
                {/* Reduced from w-48 to w-40 */}
                <DropdownMenuItem asChild className="text-center">
                  <Link href={`${getBasePath()}/invoices`} className="w-full ">
                    Invoices
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${getBasePath()}/customers`} className="w-full">
                     Customers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`${getBasePath()}/login`}
                    onClick={() => logOut()}
                    className="w-full"
                  >
                    Logout
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeSwitcher />
          </div>
        </Card>
      </nav>
    </header>
  );
};

export default BaseNavbar;
