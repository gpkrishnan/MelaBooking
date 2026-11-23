"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Save, X, Search, User, Bed as BedIcon } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import Floor from "@/components/hotel/Floor";
import { formatHotelName } from "@/lib/formatHotelName";

/**
 * RoomAssignmentDialog - Dialog for assigning members to rooms/beds
 * Uses the same hotel layout as hotel/page.jsx for visual room selection
 *
 * @param {boolean} isOpen - Controls dialog visibility
 * @param {number} familyId - Current family ID
 * @param {Object} member - Member to assign a bed to
 * @param {Function} onAssign - Callback when bed is assigned: (bedData) => void
 * @param {Function} onClose - Callback to close the dialog
 */
const RoomAssignmentDialog = ({ isOpen, familyId, member, onAssign, onClose }) => {
    const [selectedBed, setSelectedBed] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch room data with SWR
    const { data: roomData, error, isLoading } = useSWR(
        isOpen ? "data/room.php" : null,
        (url) => fetcher(url, { method: "GET" }),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Reset selection when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedBed(null);
            setSearchQuery("");
        }
    }, [isOpen]);

    const handleBedClick = (bedData) => {
        // Only allow selection of available beds or beds assigned to current family
        if (!bedData.memberid || bedData.familyid === familyId) {
            setSelectedBed(bedData);
        }
    };

    const handleAssign = () => {
        if (!selectedBed) {
            alert("Please select a bed");
            return;
        }

        onAssign({
            bedid: selectedBed.id,
            bedData: selectedBed,
        });

        setSelectedBed(null);
        setSearchQuery("");
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/50"
            style={{ zIndex: 10000, pointerEvents: "auto" }}
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-linear-to-r from-blue-600 to-teal-500 text-white">
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Hotel className="w-5 h-5" />
                            Select Bed for {member?.name || "Member"}
                        </h2>
                        {member && (
                            <div className="text-sm mt-1 opacity-90">
                                {member.sex === "M" ? "👨" : "👩"} {member.age} yrs • Preference:{" "}
                                {member.prefer?.roomtype === "A"
                                    ? "AC"
                                    : member.prefer?.roomtype === "N"
                                    ? "Non-AC"
                                    : "Dormitory"}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Selected Bed Info */}
                {selectedBed && (
                    <div className="p-3 bg-blue-50 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BedIcon className="w-4 h-4 text-blue-600" />
                                <span className="font-semibold">Selected Bed:</span>
                                <span>
                                    {selectedBed.lodge || "N/A"} - {selectedBed.floor || "N/A"} - Room{" "}
                                    {selectedBed.roomno || "N/A"} - Bed #{selectedBed.id}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${selectedBed.ac === "1" ? "bg-cyan-400" : "bg-orange-300"}`}>
                                    {selectedBed.ac === "1" ? "AC" : "Non-AC"}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedBed(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Room Layout */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && <div className="w-full p-4 text-center">Loading rooms...</div>}
                    {error && <div className="w-full p-4 text-center text-red-500">Error loading rooms</div>}
                    {!isLoading && !error && roomData && roomData.length > 0 && (
                        <Tabs defaultValue={roomData[0].name.split("-")[0]}>
                            <div className="flex w-full flex-col gap-2 border-b sticky top-0 bg-white z-20">
                                <TabsList className="w-full flex-wrap h-auto bg-linear-to-b from-gray-300 to-gray-500 text-white rounded-none">
                                    {roomData.map((hot, idx) => {
                                        return (
                                            <TabsTrigger
                                                key={hot.name.split("-")[0]}
                                                value={hot.name.split("-")[0]}
                                                className="text-xs sm:text-sm whitespace-nowrap"
                                            >
                                                {formatHotelName(hot.name)}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </div>
                            <div className="w-full h-full p-2">
                                {roomData.map((hot, idx) => {
                                    return (
                                        <TabsContent key={hot.name.split("-")[0]} value={hot.name.split("-")[0]}>
                                            <Floor
                                                hotelname={hot}
                                                familyId={familyId}
                                                isSelectable={true}
                                                onBedClick={handleBedClick}
                                            />
                                        </TabsContent>
                                    );
                                })}
                            </div>
                        </Tabs>
                    )}
                </div>

                {/* Footer with Instructions and Actions */}
                <div className="border-t bg-gray-50">
                    <div className="px-4 py-2 text-xs text-gray-600">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-gray-300 border"></div>
                                <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-lime-500 border"></div>
                                <span>Your Family</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-orange-400 border"></div>
                                <span>Other Family</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end p-4 pt-2">
                        <Button variant="outline" onClick={onClose}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedBed}
                            className="bg-linear-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Assign Bed
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomAssignmentDialog;
