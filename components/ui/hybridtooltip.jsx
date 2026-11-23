"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";

const TouchContext = createContext(undefined);
const useTouch = () => useContext(TouchContext);

export const TouchProvider = ({ children, ...props }) => {
    const [isTouch, setTouch] = useState();

    useEffect(() => {
        const mq = window.matchMedia("(pointer: coarse)");
        const update = () => setTouch(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    return (
        <TouchContext.Provider value={isTouch} {...props}>
            {children}
        </TouchContext.Provider>
    );
};

export const HybridTooltip = (props) => {
    const isTouch = useTouch();
    return isTouch ? <Popover {...props} /> : <Tooltip {...props} />;
};

export const HybridTooltipTrigger = (props) => {
    const isTouch = useTouch();
    return isTouch ? <PopoverTrigger {...props} /> : <TooltipTrigger {...props} />;
};

export const HybridTooltipContent = (props) => {
    const isTouch = useTouch();
    return isTouch ? <PopoverContent {...props} /> : <TooltipContent {...props} />;
};
