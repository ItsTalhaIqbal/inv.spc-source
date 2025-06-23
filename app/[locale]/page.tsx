"use client"
import { InvoiceMain } from "@/app/components";
import { isLogin } from "@/lib/Auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {




    return (
        <main className="py-10 lg:container">
            <InvoiceMain />
        </main>
    );
}