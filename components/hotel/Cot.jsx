"use client";

import Bed from "./Bed";

/**
 * Cot Component - Displays a cot with its beds
 *
 * @param {Object} co - Cot data containing bed array
 * @param {number} familyId - Current family ID for highlighting (optional)
 * @param {boolean} isSelectable - Whether beds can be selected (optional)
 * @param {Function} onBedClick - Callback when a bed is clicked (optional)
 * @param {boolean} showClearBtn - Show delete button for clearing assignment (optional)
 * @param {Function} onClearAssignment - Callback when clear button is clicked (optional)
 */
const Cot = ({ co, familyId, isSelectable = false, onBedClick,onBedRightClick, showClearBtn = false, onClearAssignment }) => {

    return (
        <div className={`w-full border rounded p-1 flex flex-col gap-1 overflow-hidden ${co.name=='E'?'border-dashed border-violet-500':'border-solid'}`}>
            {co.bed.map((be, bidex) => {
                if (be.valid != 1) return null;
                return (
                    <Bed
                        key={`bed-${bidex}`}
                        be={be}
                        familyId={familyId}
                        isSelectable={isSelectable}
                        onClick={onBedClick}
                        onBedRightClick={ co.name=="E"? onBedRightClick:undefined}
                        showClearBtn={showClearBtn}
                        onClearAssignment={onClearAssignment}
                    />
                );
            })}
        </div>
    );
};

export default Cot;
