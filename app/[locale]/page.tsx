"use client"
import { InvoiceMain } from "@/app/components";
import { isLogin } from "@/lib/Auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            try {
                const user = await isLogin();
                
                if (!user || user?.role !== "admin") {
                    router.push("/login");
                    return;
                }
                
                setAuthChecked(true);
            } catch (error) {
                console.error("Authentication check failed:", error);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkRole();
    }, [router]);

    if (!authChecked || loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }

    return (
        <main className="py-10 lg:container">
            <InvoiceMain />
        </main>
    );
}