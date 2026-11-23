"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Check if user is authenticated
        if (typeof window !== "undefined") {
            const auth = localStorage.getItem("isAuthenticated");
            if (auth === "true") {
                setIsAuthenticated(true);
            }
        }
        setIsLoading(false);
    }, []);

    // Password is checked on the server (be/actions/admin_login.php); it returns a signed token for protected endpoints.
    const login = async (password) => {
        try {
            const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_API_URL + "actions/admin_login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsAuthenticated(true);
                localStorage.setItem("isAuthenticated", "true");
                localStorage.setItem("adminToken", data.token);
                return true;
            }
        } catch (e) {
            // network error -> treated as failed login
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        if (typeof window !== "undefined") {
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("adminToken");
        }
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
