"use client";

import { HybridTooltip, HybridTooltipContent, HybridTooltipTrigger } from "@/components/ui/hybridtooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CircleUser, X, MoreVertical } from "lucide-react";
import { useState } from "react";

/**
 * Bed Component - Displays a single bed with occupancy information
 *
 * @param {Object} be - Bed data (name, sex, age, status, phone, familyid, etc.)
 * @param {number} familyId - Current family ID for highlighting (optional)
 * @param {boolean} isSelectable - Whether bed can be selected/clicked (optional)
 * @param {Function} onClick - Callback when bed is clicked (optional)
 * @param {boolean} showClearBtn - Show delete button for clearing assignment (optional)
 * @param {Function} onClearAssignment - Callback when clear button is clicked (optional)
 */
const Bed = ({ be, familyId, isSelectable = false, onClick, onBedRightClick, showClearBtn = false, onClearAssignment }) => {
    const [isHovered, setIsHovered] = useState(false);
     const [showPopOver, setShowPopOver] = useState(false);
   
    const handleClick = () => {
        if (isSelectable && onClick) {
            onClick(be);
        }
    };

    const handleClearClick = (e) => {
        e.stopPropagation(); // Prevent bed click event
        if (onClearAssignment && be.memberid) {
            onClearAssignment(be.memberid);
        }
    };



    const handleRightClick = (e) => {
        e.preventDefault(); // Prevent default context menu
        if (onBedRightClick===undefined){
            
            setShowPopOver(false)
        } else{
            setShowPopOver(true)
        }


        // Add your custom right-click logic here
    };

    const isCurrentFamily = familyId && be.familyid === familyId;
    const isOccupied = be.name && be.memberid;
    const isAvailable = !be.name || be.memberid === null;

    return (
        <div
            className={`overflow-hidden relative ${isSelectable ? 'cursor-pointer hover:bg-blue-50' : ''}`}
            onClick={handleClick}
            onContextMenu={handleRightClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <HybridTooltip>
                <HybridTooltipTrigger>
                    <div className="flex items-center gap-1 overflow-hidden">
                        <div>
                            {be.name  && (
                                <div
                                    className={`w-3 h-3 rounded-full border ${
                                        be.status === "A"
                                            ? "bg-gray-500"
                                            : be.status === "B"
                                                ? "bg-lime-500"
                                                : "bg-orange-400"
                                    }`}
                                ></div>
                            )}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            <CircleUser
                                size="12"
                                className={`shrink-0 ${
                                    be.sex === "F"
                                        ? "text-pink-600"
                                        : be.sex === "M"
                                            ? "text-blue-600"
                                            : "text-gray-300"
                                }`}
                            />
                            {be.name && (
                                <>
                                    <div className="truncate">{be.name}</div>
                                    <small className="shrink-0">({be.age})</small>
                                </>
                            )}
                        </div>
                    </div>
                </HybridTooltipTrigger>
                <HybridTooltipContent className="bg-neutral-500 text-white">
                    {be.name ? (
                        <div className="grid grid-cols-[80px_1fr] gap-1">
                            <div>Phone:</div>
                            <div>{be.phone}</div>
                            <div>GroupNo.:</div>
                            <div>{be.familyid}</div>
                            <div>Group Phone.:</div>
                            <div>{be.whatsapp}</div>
                            <div>City:</div>
                            <div>{be.city}</div>
                        </div>
                    ) : (
                        <div>Available Bed</div>
                    )}
                </HybridTooltipContent>
            </HybridTooltip>

            {/* Clear Assignment Button - Only show for current family's occupied beds */}
            {showClearBtn && isOccupied && isCurrentFamily && isHovered && (
                <button
                    onClick={handleClearClick}
                    className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-md z-10"
                    title="Clear bed assignment"
                >
                    <X className="w-3 h-3" />
                </button>
            )}

            {/* Popover controlled by showPopOver state */}
            <Popover open={showPopOver} onOpenChange={setShowPopOver}>
                <PopoverTrigger asChild>
                    <div className="absolute inset-0 pointer-events-none" />
                </PopoverTrigger>
                <PopoverContent className="w-64">
                    <button
                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                        onClick={() => {
                           onBedRightClick(be)
                            setShowPopOver(false);
                        }}
                    >
                        Delete Extra Bed
                    </button>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default Bed;
