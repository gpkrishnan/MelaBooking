"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EllipsisVertical, Check, Eclipse } from "lucide-react";
import Image from "next/image";
import Cot from "./Cot";

/**
 * Room Component - Displays a hotel room with its cots and beds
 *
 * @param {Object} room - Room data (name, ac, toilet, bedtype, rate, cot array)
 * @param {number} familyId - Current family ID for highlighting (optional)
 * @param {boolean} isSelectable - Whether beds can be selected (optional)
 * @param {Function} onBedClick - Callback when a bed is clicked (optional)
 * @param {Function} onRoomAction - Callback for room actions menu (optional)
 * @param {boolean} showRoomSelector - Show checkbox for room selection (optional)
 * @param {boolean} isRoomSelected - Whether this room is selected (optional)
 * @param {Function} onRoomSelect - Callback when room checkbox is clicked (optional)
 * @param {boolean} showClearBtn - Show delete button for clearing assignment (optional)
 * @param {Function} onClearAssignment - Callback when clear button is clicked (optional)
 * @param {Function} onRoomNumberClick - Callback when room number is clicked (optional)
 */
const Room = ({ room, familyId, isSelectable = false, onBedClick,onBedRightClick, onRoomAction, showRoomSelector = false, isRoomSelected = false, onRoomSelect, showClearBtn = false, onClearAssignment, onRoomNumberClick }) => {
    return (
        <div className="w-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/6 p-1 text-xs">
            <div className="w-full border rounded flex flex-col overflow-hidden">
                <div
                    className={`flex w-full gap-1 items-center justify-between border-b px-2 min-h-5 py-1 ${
                        room.ac === "1" ? "bg-cyan-400" : "bg-orange-300"
                    }`}
                >
                    <div className="flex items-center justify-start gap-1 overflow-hidden min-w-0 flex-1">
                        <div
                            className={`text-xs font-bold truncate ${onRoomNumberClick ? 'cursor-pointer hover:underline' : ''}`}
                            onClick={() => onRoomNumberClick && onRoomNumberClick(room)}
                        >
                            {room.name}
                        </div>
                        <div className="whitespace-nowrap shrink-0">({room.bedtype})</div>
                        <div className="whitespace-nowrap shrink-0">Rs.{room.rate}</div>

                    </div>
                    <div className="flex items-center justify-end gap-1 shrink-0">
                        <div className="">
                            {room.toilet === "1" ? (
                                <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/westernToilet.png`} width="16" height="16" alt="WT" />
                            ) : (
                                <Image src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/indianToilet.png`} width="16" height="16" alt="IT" />
                            )}
                        </div>
                        {showRoomSelector && (
                            <div
                                className={`w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer ${
                                    isRoomSelected ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'
                                }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onRoomSelect) onRoomSelect(room.id);
                                }}
                            >
                                {isRoomSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                        )}
                        {!showRoomSelector && onRoomAction && (
                            <Popover>
                                <PopoverTrigger>
                                    <EllipsisVertical size="12" />
                                </PopoverTrigger>
                                <PopoverContent>
                                    <div onClick={() => onRoomAction(room)}>Add Extra Bed</div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
                <div className="grow p-1 px-2 text-xs flex flex-col gap-1 overflow-hidden">
                    {room.cot.map((co, cidx) => {
                        return (
                            <Cot
                                key={`r-${room.id}-c${cidx}`}
                                co={co}
                                familyId={familyId}
                                isSelectable={isSelectable}
                                onBedClick={onBedClick}
                                onBedRightClick={onBedRightClick}
                                showClearBtn={showClearBtn}
                                onClearAssignment={onClearAssignment}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Room;
