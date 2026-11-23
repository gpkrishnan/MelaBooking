"use client";

import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from "@/components/ui/menubar";
import Link from "next/link";

const MyMenu = () => {
    return (
        <Menubar className="bg-transparent border-0 z-9999">
            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/dashboard">Dashboard</Link>
                </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/prebooking">Pre-booking</Link>
                </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/changerequests">Change requests</Link>
                </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/hotel">Hotels</Link>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/booking">Bookings</Link>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger>
                    <Link href="/receipts">Receipts</Link>
                </MenubarTrigger>
            </MenubarMenu>

            <MenubarMenu>
                <MenubarTrigger>Reports</MenubarTrigger>
                <MenubarContent>
                    <Link href="/lodgewise">
                        <MenubarItem>LodgeWise</MenubarItem>
                    </Link>
                    <Link href="/trainwise">
                        <MenubarItem>Trainwise</MenubarItem>
                    </Link>
                    <Link href="/trains">
                        <MenubarItem>Train list (pick-up)</MenubarItem>
                    </Link>
                    <Link href="/photoid">
                        <MenubarItem>Photo ID report</MenubarItem>
                    </Link>
                    <Link href="/tariff">
                        <MenubarItem>Tariff</MenubarItem>
                    </Link>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
};

export default MyMenu;
