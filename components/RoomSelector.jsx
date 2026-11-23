"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import Floor from "@/components/hotel/Floor";
import { formatHotelName } from "@/lib/formatHotelName";

/**
 * RoomSelector - Uses Floor component (same as hotel/page.jsx) with checkboxes
 */
const RoomSelector = ({ isOpen, selectedRoomIds = [], onToggleRoom, onClose }) => {
    const { data: rawRoomData, error, isLoading } = useSWR(
        isOpen ? "data/room.php" : null,
        (url) => fetcher(url, { method: "GET" }),
        { revalidateOnFocus: false, revalidateOnReconnect: false }
    );

    // Transform data to add 'id' field to rooms (Floor component expects room.id)
    const roomData = rawRoomData ? rawRoomData.map(hotel => ({
        ...hotel,
        floor: hotel.floor.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => ({
                ...room,
                id: room.roomid  // Add 'id' field for Floor/Room components
            }))
        }))
    })) : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50" style={{ zIndex: 10000 }}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4 bg-linear-to-r from-teal-500 to-blue-600 text-white">
                    <div>
                        <h2 className="text-lg font-semibold">Select Rooms</h2>
                        <p className="text-sm opacity-90">Click checkboxes to select rooms</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Same as hotel/page.jsx */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && <div className="w-full p-4 text-center">Loading rooms...</div>}
                    {error && <div className="w-full p-4 text-center text-red-500">Error loading rooms</div>}
                    {!isLoading && !error && roomData && roomData.length > 0 && (
                        <Tabs defaultValue={roomData[0].name.split("-")[0]}>
                            {/* Hotel Tabs */}
                            <div className="flex w-full flex-col border-b sticky top-0 bg-white z-20 pb-2">
                                <TabsList className="w-full flex-wrap h-auto bg-linear-to-b from-gray-300 to-gray-500 text-white rounded-xs">
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

                            {/* Hotel Content */}
                            <div className="w-full h-full pt-2 px-2">
                                {roomData.map((hot, idx) => {
                                    return (
                                        <TabsContent key={hot.name.split("-")[0]} value={hot.name.split("-")[0]} className="mt-0">
                                            <Floor
                                                hotelname={hot}
                                                showRoomSelector={true}
                                                selectedRoomIds={selectedRoomIds}
                                                onRoomSelect={onToggleRoom}
                                            />
                                        </TabsContent>
                                    );
                                })}
                            </div>
                        </Tabs>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">{selectedRoomIds.length} room(s) selected</div>
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RoomSelector;
