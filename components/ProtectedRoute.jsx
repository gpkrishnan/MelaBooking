"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Only redirect if not on login page and not authenticated
        if (!isLoading && !isAuthenticated && pathname !== "/login") {
            router.replace("/login");
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    // Always show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Always render login page regardless of auth status
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // For protected pages, show redirect message if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Redirecting to login...</div>
            </div>
        );
    }

    // Render protected content if authenticated
    return <>{children}</>;
}
