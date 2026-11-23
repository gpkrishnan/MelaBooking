"use client";

import React, { useState, useEffect } from "react";
import MyMenu from "./mymenu";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

const NavBar = () => {
    const [mounted, setMounted] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="sticky top-0 left-0 z-100 h-10 w-full bg-linear-to-r from-blue-600 to-teal-500 shadow-md text-white flex items-center justify-between px-2">
            {mounted && <MyMenu />}
            <div className="flex items-center justify-end gap-2 ">
                <div className="font-bold">Mela Rooms Booking</div>
                <LogOut className="h-4 w-4 mr-2" onClick={logout} />
            </div>
        </div>
    );
};

export default NavBar;
