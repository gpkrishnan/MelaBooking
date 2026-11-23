"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import fetcher from "@/db/fetcher";
import useSWR from "swr";
import Floor from "@/components/hotel/Floor";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import HotelAddForm from "@/components/hoteladdForm";
import WithAuth from "@/components/WithAuth";
import { formatHotelName } from "@/lib/formatHotelName";

const HotelContent = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const { data, error, isLoading, mutate } = useSWR("data/room.php", (url) => fetcher(url, { method: "GET" }));

    const addExtraBed = async (room) => {
        try {
            const response = await fetcher("actions/addbed.php", {
                method: "POST",
                data: { id: room.roomid },
            });

            toast.success("Extra bed added successfully");
            mutate(); // Revalidate the data
            return response;
        } catch (error) {
            console.error("Error adding extra bed:", error);
            toast.error("Failed to add extra bed");
            throw error;
        }
    };

    const deleteBed = async (bed) => {
        try {
            const response = await fetcher("actions/deletebed.php", {
                method: "POST",
                data: { id: bed.id },
            });

            toast.success("bed Deleted successfully");
            mutate(); // Revalidate the data
            return response;
        } catch (error) {
            console.error("Error adding extra bed:", error);
            toast.error("Failed to add extra bed");
            throw error;
        }
    };

    const handleSaveRoom = async (formData) => {
        try {
            const response = await fetcher("actions/createRoom.php", {
                method: "POST",
                data: formData,
            });

            // Check if backend returned success: false
            if (response && response.success === false) {
                toast.warning(response.message || "Failed to save room");
                return;
            }

            toast.success(selectedRoom ? "Room updated successfully" : "Room added successfully");
            mutate(); // Revalidate the data
            setIsFormOpen(false);
            setSelectedRoom(null);
            return response;
        } catch (error) {
            console.error("Error saving room:", error);
            const errorMessage = error?.message || error?.toString() || "Failed to save room";
            toast.error(errorMessage);
            throw error;
        }
    };

    const handleRoomNumberClick = (room) => {
        setSelectedRoom(room);
        setIsFormOpen(true);
    };

    const handleDeleteRoom = async (roomId) => {
        try {
            const response = await fetcher("actions/deleteRoom.php", {
                method: "POST",
                data: { roomId },
            });

            // Check if backend returned success: false
            if (response && response.success === false) {
                toast.warning(response.message || "Failed to delete room");
                return;
            }

            toast.success("Room deleted successfully");
            mutate(); // Revalidate the data
            setIsFormOpen(false);
            setSelectedRoom(null);
            return response;
        } catch (error) {
            console.error("Error deleting room:", error);
            const errorMessage = error?.message || error?.toString() || "Failed to delete room";
            toast.error(errorMessage);
            throw error;
        }
    };

    return (
        <div className="w-full">
            <div className="px-2 h-8 sticky top-10 z-10 bg-linear-to-l from-amber-300 to-green-700 flex items-center justify-between text-white font-bold text-sm sm:text-base">
                <div>Hotel</div>
                <Button onClick={() => setIsFormOpen(true)} size="sm" className="bg-white text-green-700 hover:bg-green-50 h-7 px-2 sm:px-3 whitespace-nowrap text-xs">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">New</span>
                </Button>
            </div>
            {isLoading && <div className="w-full p-2 text-sm">Loading...</div>}
            {error && <div className="w-full p-2 text-red-500 text-sm">Error loading data</div>}
            {!isLoading && !error && data && data.length > 0 && (
                <Tabs defaultValue={data[0].name.split("-")[0]}>
                    <div className="">
                        <div className="flex w-full flex-col gap-2 sm:gap-6 border-b sticky top-10 bg-white z-20">
                            <TabsList className="w-full flex-wrap h-auto bg-linear-to-b from-gray-300 to-gray-500 text-white rounded-xs">
                                {data.map((hot, idx) => {
                                    return (
                                        <TabsTrigger key={hot.name.split("-")[0]} value={hot.name.split("-")[0]} className="text-xs sm:text-sm whitespace-nowrap">
                                            {formatHotelName(hot.name)}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>
                        <div className="w-full h-full">
                            {data.map((hot, idx) => {
                                return (
                                    <TabsContent key={hot.name.split("-")[0]} value={hot.name.split("-")[0]}>
                                        <Floor hotelname={hot} onRoomAction={(room) => addExtraBed(room)} isSelectable={true} onBedRightClick={(be) => deleteBed(be)} onRoomNumberClick={handleRoomNumberClick} />
                                    </TabsContent>
                                );
                            })}
                        </div>
                    </div>
                </Tabs>
            )}

            <HotelAddForm
                open={isFormOpen}
                onSave={handleSaveRoom}
                onDelete={handleDeleteRoom}
                onCancel={() => {
                    setIsFormOpen(false);
                    setSelectedRoom(null);
                }}
                roomData={selectedRoom}
            />
        </div>
    );
};

const Hotel = () => {
    return (
        <WithAuth>
            <HotelContent />
        </WithAuth>
    );
};

export default Hotel;
