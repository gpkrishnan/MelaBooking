"use client";

import { useState, useEffect } from "react";
import fetcher from "@/db/fetcher";
import { ComboboxAdd } from "@/components/ui/comboboxAdd";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Hotel, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const HotelAddForm = ({ open = false, onSave, onCancel, onDelete, roomData = null }) => {
    const [formData, setFormData] = useState({
        lodgeName: "",
        roomNo: "",
        roomType: "",
        floor: "",
        toilet: "",
        noOfSingleCots: 0,
        noOfDoubleCots: 1,
        rate: "",
        roomId: null,
    });

    const [lodgeOptions, setLodgeOptions] = useState([]);
    const [isLoadingLodges, setIsLoadingLodges] = useState(true);

    // Populate form when roomData is provided (edit mode)
    useEffect(() => {
        if (roomData) {
            console.log("Room data received:", roomData);

            // Calculate number of single and double cots from room.cot array
            // Single cot = 1 bed, Double cot = 2 beds
            // Ignore extra beds where cot.name = 'E'
            let singleCots = 0;
            let doubleCots = 0;

            if (roomData.cot && Array.isArray(roomData.cot)) {
                roomData.cot.forEach(cotItem => {
                    // Ignore extra beds (cot name is 'E')
                    if (cotItem.name === 'E') {
                        return; // Skip this cot
                    }

                    // Count based on number of beds in the cot
                    if (cotItem.bed && Array.isArray(cotItem.bed)) {
                        if (cotItem.bed.length === 1) {
                            singleCots++;
                        } else if (cotItem.bed.length === 2) {
                            doubleCots++;
                        }
                    }
                });
            }

            // Map actype to roomType (convert to string for comparison)
            // Database: AC=1, NONAC=0, Dormitory=2
            let roomType = "";
            const acType = String(roomData.ac || "0");
            console.log("AC Type from data:", acType);

            if (acType === "1") {
                roomType = "AC";
            } else if (acType === "2") {
                roomType = "Dormitory";
            } else {
                roomType = "NONAC";
            }

            // Keep toilet as string "0" or "1" for the select
            const toiletValue = String(roomData.toilet || "0");

            console.log("Mapped values - AC:", acType, "-> RoomType:", roomType, "| Toilet:", toiletValue);
            console.log("Cots calculated - Single:", singleCots, "Double:", doubleCots);

            setFormData({
                lodgeName: roomData.lodgename || "",
                roomNo: roomData.name || "",
                roomType: roomType,
                floor: String(roomData.floor || ""),
                toilet: toiletValue,
                noOfSingleCots: singleCots,
                noOfDoubleCots: doubleCots,
                rate: roomData.rate || "",
                roomId: roomData.roomid || null,
            });
        } else {
            // Reset form for new room
            setFormData({
                lodgeName: "",
                roomNo: "",
                roomType: "",
                floor: "",
                toilet: "",
                noOfSingleCots: 0,
                noOfDoubleCots: 1,
                rate: "",
                roomId: null,
            });
        }
    }, [roomData]);

    // Fetch lodge options from backend
    useEffect(() => {
        const fetchLodgeNames = async () => {
            try {
                setIsLoadingLodges(true);
                const data = await fetcher("data/lodgenames.php", { method: "GET" });

                // Transform data to match ComboboxAdd format
                // Backend returns array of strings ['lodge1', 'lodge2', ...]
                const formattedOptions = Array.isArray(data)
                    ? data.map((lodgeName) => ({
                          value: lodgeName,
                          label: lodgeName,
                      }))
                    : [];

                setLodgeOptions(formattedOptions);
            } catch (error) {
                console.error("Error fetching lodge names:", error);
                setLodgeOptions([]);
            } finally {
                setIsLoadingLodges(false);
            }
        };

        fetchLodgeNames();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.lodgeName || !formData.roomNo || !formData.roomType ||
            !formData.floor || !formData.toilet || !formData.rate) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate that at least one cot type is selected
        if (formData.noOfSingleCots === 0 && formData.noOfDoubleCots === 0) {
            toast.error("Please add at least one single or double cot");
            return;
        }

        // Format data for backend - match the field names expected by createRoom.php
        const dataToSend = {
            lodgeName: formData.lodgeName,
            roomNo: formData.roomNo,
            roomType: formData.roomType,
            floor: formData.floor,
            toilet: formData.toilet,
            rate: formData.rate,
            noOfSingleCots: formData.noOfSingleCots,
            noOfDoubleCots: formData.noOfDoubleCots,
        };

        // Include roomId if editing
        if (formData.roomId) {
            dataToSend.roomId = formData.roomId;
        }

        console.log("Submitting data:", dataToSend);

        // Call onSave callback if provided
        if (onSave) {
            onSave(dataToSend);
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleDelete = () => {
        if (!formData.roomId) {
            toast.error("Cannot delete: Room not found");
            return;
        }

        // Confirm deletion
        if (window.confirm(`Are you sure you want to delete room ${formData.roomNo}? This action cannot be undone.`)) {
            if (onDelete) {
                onDelete(formData.roomId);
            }
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Full screen overlay */}
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                {/* Form container */}
                <div className="bg-white rounded-lg shadow-xl w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Hotel className="w-6 h-6" />
                            {roomData ? "Edit Hotel Room" : "Add Hotel Room"}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Lodge Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="lodgeName">
                                        Lodge Name <span className="text-red-500">*</span>
                                    </Label>
                                    {isLoadingLodges ? (
                                        <div className="flex items-center justify-center h-10 border rounded-md bg-muted">
                                            <span className="text-sm text-muted-foreground">
                                                Loading lodges...
                                            </span>
                                        </div>
                                    ) : (
                                        <ComboboxAdd
                                            options={lodgeOptions}
                                            value={formData.lodgeName}
                                            onChange={(value) => handleChange("lodgeName", value)}
                                        />
                                    )}
                                </div>

                                {/* Room No */}
                                <div className="space-y-2">
                                    <Label htmlFor="roomNo">
                                        Room No <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="roomNo"
                                        type="text"
                                        value={formData.roomNo}
                                        onChange={(e) => handleChange("roomNo", e.target.value)}
                                        placeholder="Enter room number"
                                    />
                                </div>

                                {/* Room Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="roomType">
                                        Room Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        key={`roomType-${formData.roomId}`}
                                        value={formData.roomType}
                                        onValueChange={(value) => handleChange("roomType", value)}
                                    >
                                        <SelectTrigger id="roomType">
                                            <SelectValue placeholder="Select room type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AC">AC</SelectItem>
                                            <SelectItem value="NONAC">NON AC</SelectItem>
                                            <SelectItem value="Dormitory">Dormitory</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Floor */}
                                <div className="space-y-2">
                                    <Label htmlFor="floor">
                                        Floor <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="floor"
                                        type="number"
                                        value={formData.floor}
                                        onChange={(e) => handleChange("floor", e.target.value)}
                                        placeholder="Enter floor number"
                                        min="0"
                                    />
                                </div>

                                {/* Toilet Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="toilet">
                                        Toilet Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        key={`toilet-${formData.roomId}`}
                                        value={formData.toilet}
                                        onValueChange={(value) => handleChange("toilet", value)}
                                    >
                                        <SelectTrigger id="toilet">
                                            <SelectValue placeholder="Select toilet type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Indian</SelectItem>
                                            <SelectItem value="1">Western</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* No of Single Cots */}
                                <div className="space-y-2">
                                    <Label htmlFor="noOfSingleCots">No of Single Cots</Label>
                                    <Input
                                        id="noOfSingleCots"
                                        type="number"
                                        value={formData.noOfSingleCots}
                                        onChange={(e) =>
                                            handleChange("noOfSingleCots", parseInt(e.target.value) || 0)
                                        }
                                        placeholder="Enter number of single cots"
                                        min="0"
                                    />
                                </div>

                            
                              

                                {/* Rate */}
                                <div className="space-y-2">
                                    <Label htmlFor="rate">
                                        Rate <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        value={formData.rate}
                                        onChange={(e) => handleChange("rate", e.target.value)}
                                        placeholder="Enter room rate"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
    {/* No of Double Cots */}
                                  <div className="space-y-2">
                                    <Label htmlFor="noOfDoubleCots">No of Double Cots</Label>
                                    <Input
                                        id="noOfDoubleCots"
                                        type="number"
                                        value={formData.noOfDoubleCots}
                                        onChange={(e) =>
                                            handleChange("noOfDoubleCots", parseInt(e.target.value) || 0)
                                        }
                                        placeholder="Enter number of double cots"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t flex items-center justify-between gap-2">
                        <div>
                            {roomData && formData.roomId && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleDelete}
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Room
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                onClick={handleSubmit}
                                className="flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Room
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HotelAddForm;
