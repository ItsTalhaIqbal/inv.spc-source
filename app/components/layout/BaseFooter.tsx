"use client"; // Ensure this is a client component since we're using hooks

import { useTranslationContext } from "@/contexts/TranslationContext";
import { usePathname } from "next/navigation"; // Import usePathname for checking the current URL

// Variables
import { AUTHOR_GITHUB } from "@/lib/variables";

const BaseFooter = () => {
    const { _t } = useTranslationContext();
    const pathname = usePathname(); // Get the current pathname

    // Check if pathname includes "/login"
    if (pathname?.includes("/login")) {
        return null; // Return null to render nothing on login page
    }

    return (
        <footer className="container py-10">
            <p>
                {"  "}
                {/* {_t("footer.developedBy")}{" "}
                <a
                    href={AUTHOR_GITHUB}
                    target="_blank"
                    style={{ textDecoration: "underline" }}
                >
                    Ali Abbasov
                </a> */}
            </p>
        </footer>
    );
};

export default BaseFooter;