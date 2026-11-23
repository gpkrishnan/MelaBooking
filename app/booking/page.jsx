"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import fetcher from "@/db/fetcher";
import { UserCircle, Search, X, Plus, Edit2 } from "lucide-react";
import { useState, useMemo } from "react";
import BookingForm from "@/components/bookingform";
import WithAuth from "@/components/WithAuth";

import useSWR from "swr";

// Stable colour per legend, so related bookings are easy to spot on the page
const LEGEND_COLORS = ["bg-rose-100 text-rose-800 border-rose-300", "bg-sky-100 text-sky-800 border-sky-300", "bg-amber-100 text-amber-800 border-amber-300", "bg-emerald-100 text-emerald-800 border-emerald-300", "bg-violet-100 text-violet-800 border-violet-300", "bg-orange-100 text-orange-800 border-orange-300", "bg-teal-100 text-teal-800 border-teal-300", "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300"];
const legendColor = (name) => {
    let h = 0;
    for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return LEGEND_COLORS[h % LEGEND_COLORS.length];
};

const BookingContent = () => {
    const { data, error, isLoading, mutate } = useSWR("data/members_full_list.php", (url) => fetcher(url, { method: "GET" }));
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingFamilyId, setEditingFamilyId] = useState(0);

    const formatAmount = (amount) => {
        return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatPhone = (phone) => {
        if (!phone) return "";
        const cleaned = phone.toString().replace(/\D/g, "");
        if (cleaned.length === 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        return phone;
    };

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!data || !searchTerm.trim()) return data;

        const lowerSearch = searchTerm.toLowerCase().trim();

        return data.filter((fmly) => {
            // Search in family leader name
            if (fmly.leader?.toLowerCase().includes(lowerSearch)) return true;

            // Search in related-group legend
            if (fmly.related_group?.toLowerCase().includes(lowerSearch)) return true;

            // Search in group number
            if (fmly.groupNo?.toString().toLowerCase().includes(lowerSearch)) return true;

            // Search in city
            if (fmly.city?.toLowerCase().includes(lowerSearch)) return true;

            // Search in remarks
            if (fmly.fremarks?.toLowerCase().includes(lowerSearch)) return true;

            // Search in phone/whatsapp
            if (fmly.whatsapp?.toString().includes(lowerSearch)) return true;

            // Search in member names
            if (fmly.members?.some((mem) => mem.name?.toLowerCase().includes(lowerSearch))) return true;

            // Search in member phones
            if (fmly.members?.some((mem) => mem.phone?.toString().includes(lowerSearch))) return true;

            // Search in hotel/room
            if (fmly.members?.some((mem) => mem.hotel?.toLowerCase().includes(lowerSearch) || mem.room?.toString().toLowerCase().includes(lowerSearch))) return true;

            return false;
        });
    }, [data, searchTerm]);

    const handleClearSearch = () => {
        setSearchTerm("");
    };

    const handleNewBooking = () => {
        setEditingFamilyId(0);
        setIsFormOpen(true);
    };

    const handleEditBooking = (familyId) => {
        setEditingFamilyId(familyId);
        setIsFormOpen(true);
    };

    const handleSaveBooking = (familyId) => {
        console.log("Booking saved:", familyId);
        setIsFormOpen(false);
        // Refresh the data
        mutate();
    };

    const handleCancelBooking = () => {
        setIsFormOpen(false);
    };

    return (
        <div className="w-full bg-gray-100 min-h-screen">
            <div className="px-2 py-1 sm:py-2 sticky top-0 sm:top-10 z-20 bg-linear-to-r from-amber-300 to-green-700 flex items-center justify-between gap-2 text-white rounded-t font-bold text-xs sm:text-base">
                <div className="hidden sm:block whitespace-nowrap">Booking</div>
                <div className="flex items-center justify-end gap-3">
                    {/* New Booking Button */}
                    <Button onClick={handleNewBooking} size="sm" className="bg-white text-green-700 hover:bg-green-50 h-7 px-2 sm:px-3 whitespace-nowrap text-xs">
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">New</span>
                    </Button>

                    {/* Search Bar */}
                    <div className="relative flex items-center gap-2 flex-1 sm:max-w-sm">
                        <Search className="h-4 w-4 text-gray-800" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="block w-full px-2 py-1 border rounded leading-5 bg-white text-black placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:border-gray-400 text-xs sm:text-sm"
                        />
                        {searchTerm && (
                            <button onClick={handleClearSearch} className="absolute right-2 flex items-center cursor-pointer">
                                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && <div className="w-full p-2 text-sm">Loading...</div>}
            {error && <div className="w-full p-2 text-red-500 text-sm">Error loading data</div>}

            {!isLoading && !error && filteredData && filteredData.length === 0 && searchTerm && <div className="w-full p-4 text-center text-gray-500 text-xs sm:text-sm">No results found for "{searchTerm}"</div>}

            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center p-1 sm:p-2">
                {filteredData &&
                    filteredData.length > 0 &&
                    filteredData.map((fmly, fidx) => {
                        return (
                            <Card
                                key={fmly.familyid}
                                className={`p-1 gap-1 sm:p-2 space-y-0 w-full sm:w-[380px] text-[10px] sm:text-xs bg-white border-gray-400 rounded-md cursor-pointer shadow-none hover:shadow-md transition-shadow hover:shadow-gray-700 ${
                                    fmly.status == "C" ? "opacity-30" : ""
                                }`}
                                onClick={() => handleEditBooking(fmly.familyid)}
                            >
                                <CardHeader className="p-0  rounded relative">
                                    <div
                                        className={`flex items-center justify-between px-1 sm:px-2 py-0.5 gap-1 border-b rounded-t font-bold ${
                                            fmly.status == "R" ? "bg-indigo-300/50" : fmly.status == "B" ? "bg-green-300/50" : "bg-gray-300/50"
                                        } text-[10px] sm:text-xs`}
                                    >
                                        <div className="truncate flex-1">{fmly.leader}</div>
                                        <div className="whitespace-nowrap">{fmly.groupNo}</div>
                                    </div>
                                    <div className="px-1 sm:px-2 py-0.5 flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-xs">
                                        <div className="truncate">{fmly.city}</div>
                                        <div className="font-semibold whitespace-nowrap text-[9px] sm:text-[10px]">Ph: {formatPhone(fmly.whatsapp)}</div>
                                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                            {fmly.sex.map((s, sidx) => {
                                                return (
                                                    <div key={`f-${fidx}-s${sidx}`} className="flex items-center gap-0.5">
                                                        {s.count > 0 && (
                                                            <>
                                                                <UserCircle size="10" className={`sm:w-3 sm:h-3 ${s.type == "F" ? "text-pink-600" : "text-blue-600"}`} />
                                                                <span className="text-[9px] sm:text-xs">{s.count}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="px-1 sm:px-2 py-0.5 flex flex-wrap items-center justify-between gap-1 text-[9px] sm:text-xs">
                                        <div className="whitespace-nowrap">Bill: {formatAmount(fmly.bill)}</div>
                                        <div className="whitespace-nowrap">Recd: {formatAmount(fmly.recd)}</div>
                                        {fmly.balance > 0 && <div className="font-bold text-white bg-orange-700 border px-1 rounded whitespace-nowrap text-[9px] sm:text-xs">Bal: {formatAmount(fmly.balance)}</div>}
                                        {fmly.balance < 0 && <div className="font-bold text-white bg-teal-600 border px-1 rounded whitespace-nowrap text-[9px] sm:text-xs">Bal: {formatAmount(fmly.balance)}</div>}
                                        <div className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                                            <span className="hidden sm:inline">Status:</span>
                                            {fmly.status} <div className={`h-2 w-2 sm:h-3 sm:w-3 rounded-full border ${fmly.status == "A" ? "bg-gray-600" : fmly.status == "B" ? "bg-lime-600" : "bg-indigo-500"}`}></div>
                                        </div>
                                    </div>
                                    {fmly.related_group && (
                                        <div className="px-1 sm:px-2 py-0.5 text-[9px] sm:text-xs">
                                            <button
                                                type="button"
                                                title="Show all bookings in this group"
                                                className={`font-semibold border px-1 rounded cursor-pointer ${legendColor(fmly.related_group)}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSearchTerm(fmly.related_group);
                                                }}
                                            >
                                                &#128279; {fmly.related_group}
                                            </button>
                                        </div>
                                    )}
                                    {fmly.RECEIPT_NO && (
                                        <div className="px-1 sm:px-2 py-0.5 text-[9px] sm:text-xs">
                                            <span className="text-green-700 font-semibold font-mono bg-green-50 border border-green-200 px-1 rounded">&#128176; {fmly.RECEIPT_NO}</span>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="w-full px-0.5 sm:px-1">
                                        <Table className="w-full table-fixed">
                                            <TableBody>
                                                {fmly.members.map((mem, midx) => {
                                                    return (
                                                        <TableRow className="p-0 text-[9px] sm:text-xs" key={`f-${fmly.familyid}-m${midx}`}>
                                                            <TableCell className="py-0.5 px-1 sm:py-1 sm:px-2 w-[47%] overflow-hidden">
                                                                <div className="truncate">
                                                                    {midx + 1}. {mem.name} ({mem.age})
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-0.5 px-1 sm:py-1 sm:px-2 w-[28%] text-[8px] sm:text-xs overflow-hidden">
                                                                <div className="truncate">{mem.phone}</div>
                                                            </TableCell>
                                                            <TableCell className="py-0.5 px-1 sm:py-1 sm:px-2 w-[25%] text-center overflow-hidden ">
                                                                <div className="truncate text-[8px] sm:text-xs flex items-center gap-0.5">
                                                                    <div className={`h-2 w-2 rounded-full ${mem.p_type == "A" ? "bg-blue-300" : mem.p_type == "N" ? "bg-orange-300" : "bg-gray-400"}`}></div>
                                                                    {mem.bedid != null && mem.bedid != "" ? (
                                                                        <div className={`truncate px-1 rounded text-[8px] sm:text-xs ${mem.ac == "AC" ? "bg-blue-300/50" : mem.ac == "Non-AC" ? "bg-orange-300/50" : "bg-gray-300/50"}`}>
                                                                            {mem.hotel.split("-")[0]}/{mem.room}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-3 h-2 sm:w-4 sm:h-3 bg-fuchsia-500 border rounded mx-auto"></div>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="whitespace-pre-wrap p-0.5 sm:p-1 flex items-center text-[9px] sm:text-xs">{fmly.fremarks}</div>
                                </CardContent>
                            </Card>
                        );
                    })}
            </div>

            {/* Booking Form Dialog */}
            <BookingForm open={isFormOpen} familyId={editingFamilyId} onSave={handleSaveBooking} onCancel={handleCancelBooking} onOpenChange={setIsFormOpen} />
        </div>
    );
};

const Booking = () => {
    return (
        <WithAuth>
            <BookingContent />
        </WithAuth>
    );
};

export default Booking;
