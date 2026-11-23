"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import fetcher from "@/db/fetcher";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bed as BedIcon, User, CircleUser } from "lucide-react";
import Room from "@/components/hotel/Room";
import { toast } from "sonner";
import { formatHotelName } from "@/lib/formatHotelName";

/**
 * RoomBedAssignment - Display selected rooms with Floor component and bed assignment
 */
const RoomBedAssignment = ({ familyId = 0, selectedRoomIds = [], members = [], bedAssignments = {}, onAssignBed, onRemoveRoom }) => {
    const [assigningBedId, setAssigningBedId] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    // Fetch only rooms assigned to this family from the backend
    // For new bookings (familyId=0), still fetch if rooms are selected
    const shouldFetch = (familyId && familyId !== 0) || (selectedRoomIds && selectedRoomIds.length > 0);
    const { data: rawRoomData = [], error, isLoading } = useSWR(
        shouldFetch ? ["data/getroom.php", familyId || 0, selectedRoomIds] : null,
        ([url, fid, addrooms]) => fetcher(url, {
            method: "POST",
            data: {
                familyid: fid,
                addrooms: addrooms.length > 0 ? addrooms : undefined
            }
        }),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    );

    // Transform data to add 'id' field to rooms and merge local bed assignments
    const selectedRoomsData = rawRoomData.map(hotel => ({
        ...hotel,
        floor: hotel.floor.map(floor => ({
            ...floor,
            rooms: floor.rooms.map(room => ({
                ...room,
                id: room.roomid,  // Add 'id' field for Floor/Room components
                // Merge local bed assignments into bed data for real-time UI updates
                cot: room.cot.map(cot => ({
                    ...cot,
                    bed: cot.bed.map(bed => {
                        // Check if this bed has a local assignment
                        const assignedMemberIndex = bedAssignments[bed.id];

                        if (assignedMemberIndex !== undefined && members[assignedMemberIndex]) {
                            // This bed has a local assignment - show the assigned member
                            const assignedMember = members[assignedMemberIndex];
                            return {
                                ...bed,
                                memberid: assignedMember.memberid || -1, // Use -1 for new members
                                name: assignedMember.name,
                                sex: assignedMember.sex,
                                age: assignedMember.age,
                                phone: assignedMember.phone,
                                familyid: familyId,
                                status: assignedMember.status || "P", // Default to Pending
                            };
                        } else if (bed.memberid && bed.familyid === familyId) {
                            // This bed has backend data for current family
                            // Check if this member is now assigned to a different bed locally
                            const memberNowOnDifferentBed = Object.entries(bedAssignments).some(
                                ([assignedBedId, memberIdx]) => {
                                    const member = members[memberIdx];
                                    return member && member.memberid === bed.memberid && assignedBedId !== bed.id;
                                }
                            );

                            if (memberNowOnDifferentBed) {
                                // Clear this bed since member moved to another bed
                                return {
                                    ...bed,
                                    memberid: null,
                                    name: null,
                                    sex: null,
                                    age: null,
                                    phone: null,
                                    familyid: null,
                                    status: null,
                                };
                            }
                        }

                        return bed;
                    })
                }))
            }))
        }))
    }));

    const handleBedClick = (bedData) => {
        // Only allow assignment if bed is available or assigned to current family
        if (!bedData.memberid || bedAssignments[bedData.id] !== undefined) {
            setAssigningBedId(bedData.id);
        }
    };

    const handleSelectMember = (memberIndex) => {
        if (assigningBedId) {
            onAssignBed(assigningBedId, memberIndex);
            setAssigningBedId(null);
        }
    };

    const handleClearAssignment = async (memberid) => {
        if (!memberid || isClearing) return;

        if (!confirm("Are you sure you want to clear this bed assignment?")) {
            return;
        }

        setIsClearing(true);
        try {
            // Check if this is a local assignment (not yet saved to database)
            // Find the bed that has this member assigned locally
            let isLocalAssignment = false;
            let bedIdToClear = null;

            for (const [bedId, memberIndex] of Object.entries(bedAssignments)) {
                const member = members[memberIndex];
                if (member && (member.memberid === memberid || (!member.memberid && memberid === -1))) {
                    isLocalAssignment = true;
                    bedIdToClear = bedId;
                    break;
                }
            }

            if (isLocalAssignment && bedIdToClear) {
                // Clear local assignment only
                onAssignBed(bedIdToClear, null);
                toast.success("Bed assignment cleared");
            } else if (memberid > 0) {
                // Clear from database
                const result = await fetcher("actions/clearroom.php", {
                    method: "POST",
                    data: { memberid }
                });

                if (result.success) {
                    toast.success(result.message || "Bed assignment cleared");
                    // Refresh the room data
                    mutate(["data/getroom.php", familyId, selectedRoomIds]);
                    // Also refresh family data if needed
                    if (familyId) {
                        mutate(["data/singlefamily.php", familyId]);
                    }
                } else {
                    toast.error(result.message || "Failed to clear assignment");
                }
            }
        } catch (error) {
            console.error("Error clearing assignment:", error);
            toast.error("Error clearing assignment: " + error.message);
        } finally {
            setIsClearing(false);
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="text-center py-12 text-gray-500">
                <BedIcon className="w-16 h-16 mx-auto mb-4 opacity-30 animate-pulse" />
                <p className="text-lg font-medium">Loading rooms...</p>
            </div>
        );
    }

    // Show empty state if no rooms assigned yet
    if (!selectedRoomsData || selectedRoomsData.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <BedIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No rooms assigned</p>
                <p className="text-sm">Click "Add Room" to select rooms for this booking</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {selectedRoomsData.length > 0 && selectedRoomsData.map((hotel) => (
                    <div key={hotel.name} className="space-y-4">
                        {/* Hotel Header */}
                        {/* <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 rounded-md border-l-4 border-blue-500">
                            <h3 className="font-semibold text-lg text-gray-800">
                                {formatHotelName(hotel.name)}
                            </h3>
                        </div> */}

                        {/* Floors and Rooms */}
                        {hotel.floor.map((floor) => (
                            <div key={floor.name} className="space-y-2">
                                {/* Floor Header */}
                                {/* <div className="bg-gray-50 px-4 py-2 rounded border-l-4 border-green-500">
                                    <h4 className="font-medium text-gray-700">
                                        Floor: {floor.name.split("-")[1]}
                                    </h4>
                                </div> */}

                                {/* Rooms */}
                                <div className="flex flex-wrap">
                                    {floor.rooms.map((room, ridx) => {
                                        const RoomComponent = require("@/components/hotel/Room").default;
                                        return (
                                            <div key={`${room.id}-${ridx}`} className="flex flex-col gap-1 items-center justify-start">
                                            <div>{formatHotelName(hotel.name)} (F{floor.name.split("-")[1]})</div>
                                            <RoomComponent
                                                room={room}
                                                familyId={familyId}
                                                isSelectable={true}
                                                onBedClick={handleBedClick}
                                                showClearBtn={true}
                                                onClearAssignment={handleClearAssignment}
                                            />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Member Selection Dialog */}
            <Dialog open={assigningBedId !== null} onOpenChange={() => setAssigningBedId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Member to Bed #{assigningBedId}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {members.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>No members added yet</p>
                                <p className="text-sm">Add members in the Members tab first</p>
                            </div>
                        ) : (
                            members.map((member, index) => {
                                // Check if this member already has a bed assigned
                                const hasOtherBed = member.bed && member.bed.bedid && member.bed.bedid !== assigningBedId;

                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleSelectMember(index)}
                                        className={`p-3 border rounded cursor-pointer transition-all ${
                                            hasOtherBed
                                                ? 'border-orange-300 bg-orange-50'
                                                : 'border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CircleUser
                                                size={24}
                                                className={member.sex === "F" ? "text-pink-600" : "text-blue-600"}
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold">{member.name}</div>
                                                <div className="text-sm text-gray-600">
                                                    {member.age} yrs • {member.prefer?.roomtype === "A" ? "AC" : member.prefer?.roomtype === "N" ? "Non-AC" : "Dormitory"}
                                                </div>
                                                {hasOtherBed && (
                                                    <div className="text-xs text-orange-600 mt-1">
                                                        ⚠ Already assigned to Bed #{member.bed.bedid}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default RoomBedAssignment;
