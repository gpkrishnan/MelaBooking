"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Room from "./Room";

/**
 * Floor Component - Displays floors with tabs and rooms in each floor
 *
 * @param {Object} hotelname - Hotel data containing floor array
 * @param {number} familyId - Current family ID for highlighting (optional)
 * @param {boolean} isSelectable - Whether beds can be selected (optional)
 * @param {Function} onBedClick - Callback when a bed is clicked (optional)
 * @param {Function} onRoomAction - Callback for room actions menu (optional)
 * @param {boolean} showRoomSelector - Show checkbox for room selection (optional)
 * @param {Array} selectedRoomIds - Array of selected room IDs (optional)
 * @param {Function} onRoomSelect - Callback when room checkbox is clicked (optional)
 * @param {boolean} showClearBtn - Show delete button for clearing assignment (optional)
 * @param {Function} onClearAssignment - Callback when clear button is clicked (optional)
 * @param {Function} onRoomNumberClick - Callback when room number is clicked (optional)
 */
const Floor = ({ hotelname, familyId, isSelectable = false, onBedClick,onBedRightClick, onRoomAction, showRoomSelector = false, selectedRoomIds = [], onRoomSelect, showClearBtn = false, onClearAssignment, onRoomNumberClick }) => {
    // Handle case where hotel has no floors
    if (!hotelname.floor || hotelname.floor.length === 0) {
        return <div className="p-4 text-gray-500">No floors available</div>;
    }

    return (
        <>
            <Tabs defaultValue={hotelname.floor[0].name}>
                <div className="flex w-full flex-col border-b sticky top-0 bg-white z-10 mb-2">
                    <TabsList className="w-full flex-wrap h-auto bg-neutral-100 text-white rounded-xs">
                        {hotelname.floor.map((flo, idx1) => {
                            return (
                                <TabsTrigger
                                    key={`${flo.name}-${idx1}`}
                                    value={flo.name}
                                    className="text-xs sm:text-sm whitespace-nowrap"
                                >
                                    Floor: {flo.name.split("-")[1]}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>
                <div className="w-full h-full">
                    {hotelname.floor.map((flo, idx2) => {
                        return (
                            <TabsContent key={`${flo.name.split("-")[0]}-det$-${idx2}`} value={flo.name} className="mt-0">
                                <div className="flex flex-wrap">
                                    {flo.rooms.map((room, ridx) => {
                                        // Add lodgename and floor to room object for edit functionality
                                        const enrichedRoom = {
                                            ...room,
                                            lodgename: hotelname.name,
                                            floor: flo.name.split("-")[1]
                                        };
                                        return (
                                            <Room
                                                key={`${room.id}-${ridx}`}
                                                room={enrichedRoom}
                                                familyId={familyId}
                                                isSelectable={isSelectable}
                                                onBedClick={onBedClick}
                                                onBedRightClick={onBedRightClick}
                                                onRoomAction={onRoomAction}
                                                showRoomSelector={showRoomSelector}
                                                isRoomSelected={selectedRoomIds.includes(room.id)}
                                                onRoomSelect={onRoomSelect}
                                                showClearBtn={showClearBtn}
                                                onClearAssignment={onClearAssignment}
                                                onRoomNumberClick={onRoomNumberClick}
                                            />
                                        );
                                    })}
                                </div>
                            </TabsContent>
                        );
                    })}
                </div>
            </Tabs>
        </>
    );
};

export default Floor;
