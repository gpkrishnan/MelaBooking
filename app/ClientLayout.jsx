"use client";
import { AuthProvider } from "@/contexts/AuthContext";
import NavBar from "@/components/navBar";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname?.replace(/\/$/, "") === "/login"; // exported pages have a trailing slash

    return (
        <AuthProvider>
            {!isLoginPage && <NavBar />}
            <div className="w-full h-full p-0">{children}</div>
        </AuthProvider>
    );
}
