"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import { formatHotelName } from "@/lib/formatHotelName";

/**
 * WhatsAppMessage Component
 *
 * Reads WhatsApp message templates from public/whatsAppMsg folder,
 * fills placeholders with family/booking data, and sends via WhatsApp Web
 *
 * @param {boolean} isOpen - Dialog open state
 * @param {function} onClose - Close handler
 * @param {object} familyData - Family details (leader, phone, city, etc.)
 * @param {array} members - Array of member objects
 * @param {object} bookingData - Booking/payment details
 * @param {array} roomAssignments - Room assignment details
 */
const WhatsAppMessage = ({ isOpen, onClose, familyData = {}, members = [], bookingData = {}, roomAssignments = [], initialTemplate = "blank" }) => {
    const templates = [
        { value: "blank", label: "Blank Message", file: null },
        { value: "registration", label: "Registration Confirmation", file: "registrationMsg.Txt" },
        { value: "booking", label: "Booking/Payment Confirmation", file: "bookingMsg.txt" },
        { value: "roomdetails", label: "Room Details", file: "roomdetailsMsg.txt" },
        { value: "reminder", label: "Payment Reminder", file: "reminderMsg.txt" },
        { value: "modification", label: "Modification", file: "modifiedMsg.txt" },
        { value: "cancelation", label: "Cancelation", file: "cancelMsg.txt" },
    ];
    const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
    const [messageText, setMessageText] = useState("");
    const [previewText, setPreviewText] = useState("");

   // Load hoteladdress with SWR
    const { data: hotels = [] } = useSWR("data/hotelAddress.php", (url) => fetcher(url, { method: "GET" }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // Set template when dialog opens with initialTemplate
    useEffect(() => {
        if (isOpen && initialTemplate) {
            setSelectedTemplate(initialTemplate);
        }
    }, [isOpen, initialTemplate]);

    // Load template when selection changes
    useEffect(() => {
        if (selectedTemplate === "blank") {
            setMessageText("");
            setPreviewText("");
            return;
        }

        const template = templates.find((t) => t.value === selectedTemplate);
        if (template && template.file) {
            loadTemplate(template.file);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate]);

    // Auto-fill placeholders when messageText changes
    useEffect(() => {
        if (messageText) {
            const filled = fillPlaceholders(messageText);
            setPreviewText(filled);
        } else {
            setPreviewText("");
        }
    }, [messageText, familyData, members, bookingData, roomAssignments]);

    const loadTemplate = async (filename) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/whatsAppMsg/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${filename}`);
            }
            const text = await response.text();
            setMessageText(text);
        } catch (error) {
            console.error("Error loading template:", error);
            toast.error("Failed to load template");
            setMessageText("");
        }
    };

    const fillPlaceholders = (template) => {
        let filled = template;

        // Family placeholders
        filled = filled.replace(/{registrationRef}/g, familyData.groupNo || "");
        filled = filled.replace(/{groupHeadName}/g, familyData.leader || "");
        filled = filled.replace(/{phone}/g, familyData.whatsapp || familyData.phone2 || "");
        filled = filled.replace(/{city}/g, familyData.city || "");

        // Accommodation details
        const accommodationType = getAccommodationType();
        filled = filled.replace(/{accommodationDetails}/g, accommodationType);
        filled = filled.replace(/{roomOccupancyTa}/g, getRoomOccupancy(accommodationType, true));
        filled = filled.replace(/{roomOccupancy}/g, getRoomOccupancy(accommodationType, false));

        // Payment/Booking placeholders
        filled = filled.replace(/{payableBalanceAmount}/g, formatCurrency(bookingData.bill_amount - bookingData.recd_amount) || "0");
        filled = filled.replace(/{amount}/g, formatCurrency(bookingData.recd_amount) || "0");
        filled = filled.replace(/{payableAmount}/g, formatCurrency(bookingData.bill_amount) || "0");
        filled = filled.replace(/{paymentDate}/g, formatDate(bookingData.receipt_date) || "");
        filled = filled.replace(/{paymentDetails}/g, bookingData.pay_detail || "");
        filled = filled.replace(/{paymentDueDate}/g, getPaymentDueDate());

        // Members details
        const membersDetails = formatMembersDetails();
        filled = filled.replace(/{membersDetails}/g, membersDetails);

           // Members details with room
        const membersDetailswithRoomDetails = formatMembersDetailswithRoom();
        filled = filled.replace(/{membersDetailswithRoomDetails}/g, membersDetailswithRoomDetails);

        // Room/Hotel details
        const hotelAddressData = formathotelAddress();
        filled = filled.replace(/{hotelName}/g, hotelAddressData.hotelName);
        filled = filled.replace(/{hotelAddress}/g, hotelAddressData.hotelAddress);
        filled = filled.replace(/{hotelPhone}/g, hotelAddressData.hotelPhone);
        filled = filled.replace(/{roomDetails}/g, hotelAddressData.roomDetails);

        return filled;
    };

    // People per room from the booking's room fields (null for dormitory or bookings with no split saved).
    const getPlanCounts = () => {
        if (familyData.roomkind && familyData.roomkind !== "DOR" && Array.isArray(familyData.roomsplan)) {
            const counts = familyData.roomsplan.map(Number).filter((n) => n > 0);
            if (counts.length) return counts;
        }
        return null;
    };

    const getAccommodationType = () => {
        if (familyData.roomkind === "DOR") return "Dormitory";
        const counts = getPlanCounts();
        if (counts) {
            const kind = familyData.roomkind === "AC" ? "AC" : "Non-AC";
            const beds = familyData.roombeds ? `, ${familyData.roombeds} bed` : "";
            return `${kind} - ${counts.length} ${counts.length === 1 ? "room" : "rooms"}${beds} (${counts.join(" + ")} persons)`;
        }
        // First remarks line, without the "| Est. Rs.…" estimate that older pre-booking transfers appended
        const line = familyData.fremarks?.split('\n')[0] || familyData.fremarks || "";
        return line.replace(/\s*\|\s*Est\.[^\n]*$/, "").trim();
        // if (!members || members.length === 0) return "Not specified";

        // const types = new Set();
        // members.forEach((member) => {
        //     if (member.prefer?.roomtype === "A") types.add("AC Room");
        //     else if (member.prefer?.roomtype === "N") types.add("Non-AC Room");
        //     else if (member.prefer?.roomtype === "D") types.add("Dormitory");
        // });

        // return Array.from(types).join(", ") || "Not specified";
    };

    // People beyond the beds of the room type sleep on the floor (3 in a 3-bed room: all in bed; 5 in a 3-bed room: 3 + 2). Without a room type, 2 are on the cot. Several rooms ("AC[3,4]") are listed per room.
    const getRoomOccupancy = (accommodationType, tamil) => {
        const text = getRoomOccupancyBase(accommodationType, tamil);
        // booked together with other single-person bookings (Combine No set, and not just cleared on the form)
        const combined = familyData.combineno && !(familyData.sharetouched && !(familyData.shareref || "").trim());
        if (!combined) return text;
        return text + (tamil ? " (நீங்கள் அறையின் ஒரு பகுதிக்கு மட்டுமே முன்பதிவு செய்திருப்பதால், அறையை மற்றவர்களுடன் பகிர்ந்து கொள்ள நேரிடலாம்.)" : " (You may share the room with others as you are booked only for partial room.)");
    };

    const getRoomOccupancyBase = (accommodationType, tamil) => {
        if (familyData.roomkind === "DOR") return tamil ? "பொது தங்கும் அறை (Dormitory)." : "Dormitory (shared hall).";
        const m = /\[([^\]]*)\]/.exec(accommodationType || "");
        const counts = getPlanCounts() || (m ? m[1].split(/[,\s+]+/).map(Number).filter((n) => n > 0) : []);
        if (counts.length === 0 && Number(familyData.roombeds) > 2) {
            const b = Number(familyData.roombeds);
            return tamil
                ? `ஒரு அறையில் ${b} பேர் கட்டிலிலும், கூடுதலாக உள்ளவர்கள் தரையில் கூடுதல் படுக்கையிலும் (Extra bedding) தங்குவர்.`
                : `${b} persons per room sleep in bed; any extra persons sleep on the floor on extra bedding.`;
        }
        if (counts.length === 0) {
            return tamil
                ? "ஒரு அறையில் 2 பேர் கட்டிலிலும், மற்றவர்கள் தரையில் கூடுதல் படுக்கையிலும் (Extra bedding) தங்குவர்."
                : "2 persons sleep on the cot (bed); the others sleep on the floor on extra bedding.";
        }
        const beds = Number(familyData.roombeds) || 2; // beds in the room type (3 Bed room: 3 persons all in bed)
        const describe = (n) => {
            const bed = Math.min(n, beds);
            const floor = n - bed;
            if (tamil) return `${bed} பேர் கட்டிலிலும்` + (floor ? `, ${floor} பேர் தரையில் கூடுதல் படுக்கையிலும் (Extra bedding)` : "") + " தங்குவர்";
            return `${bed} in bed` + (floor ? `, ${floor} on floor (extra bedding)` : "");
        };
        if (counts.length === 1) return describe(counts[0]) + (tamil ? "." : "");
        return counts.map((n, i) => (tamil ? `அறை ${i + 1}: ` : `Room ${i + 1}: `) + describe(n)).join("; ") + (tamil ? "." : "");
    };

    const formatMembersDetails = () => {
        if (!members || members.length === 0) return "No members registered";

        return members
            .map((member, index) => {
                return `${index + 1}. ${member.name} (${member.age}yrs, ${member.sex === "M" ? "Male" : "Female"})`;
            })
            .join("\n");
    };

    const formatMembersDetailswithRoom = () => {
        if (!members || members.length === 0) return "No members registered";

        return members
            .map((member, index) => {
                const hotelName = formatHotelName(member.bed?.lodge) || "Not assigned";
                const roomNo = member.bed?.roomno || "Not assigned";
                return `${index + 1}. ${member.name} (${member.age}yrs, ${member.sex === "M" ? "Male" : "Female"}) - Hotel: ${hotelName} - Room No. ${roomNo}`;
            })
            .join("\n");
    };

    const formathotelAddress = () => {
        // Extract unique hotel codes from members
        const hotelCodesMap = new Map(); // Map<hotelCode, { hotelName, rooms[] }>

        if (members && members.length > 0) {
            members.forEach((member) => {
                if (member.bed && member.bed.lodge) {
                    // Extract hotel code from lodge (e.g., "RLB-Hotel_Name" -> "RLB")
                    const hotelCode = member.bed.lodge.split("-")[0];
                    const hotelName = formatHotelName(member.bed.lodge) || "Unknown";
                    const roomNo = member.bed.roomno || "";

                    if (!hotelCodesMap.has(hotelCode)) {
                        hotelCodesMap.set(hotelCode, {
                            hotelName: hotelName,
                            rooms: []
                        });
                    }

                    if (roomNo && !hotelCodesMap.get(hotelCode).rooms.includes(roomNo)) {
                        hotelCodesMap.get(hotelCode).rooms.push(roomNo);
                    }
                }
            });
        }

        // If no hotels found from members, return default
        if (hotelCodesMap.size === 0) {
            return {
                hotelName: "To be assigned",
                hotelAddress: "Address will be shared soon",
                hotelPhone: "Contact number to be shared",
                roomDetails: "Room numbers to be assigned",
            };
        }

        // Match hotel codes with fetched hotel data
        const hotelDetails = [];

        hotelCodesMap.forEach((value, hotelCode) => {
            const hotelData = hotels.find(h => h.code === hotelCode);

            if (hotelData) {
                hotelDetails.push({
                    name: hotelData.hotelname?.trim() || value.hotelName,
                    address: hotelData.address || "Address not available",
                    phone: hotelData.phoneNo || "Phone not available",
                    mapLink: hotelData.maplink || "",
                    distance_to_venue: hotelData.distance_to_venue || "",
                    rooms: value.rooms
                });
            } else {
                // Fallback if hotel not found in database
                hotelDetails.push({
                    name: value.hotelName,
                    address: "Address not available",
                    phone: "Phone not available",
                    mapLink: "",
                    distance_to_venue: "",
                    rooms: value.rooms
                });
            }
        });

        // Format output - always show complete details regardless of single or multiple hotels
        if (hotelDetails.length === 1) {
            const hotel = hotelDetails[0];
            const roomList = hotel.rooms.length > 0 ? hotel.rooms.join(", ") : "TBA";
            return {
                hotelName: hotel.name,
                hotelAddress: `${hotel.name}\n${hotel.address}\nPhone: ${hotel.phone}${hotel.mapLink ? `\nMap: ${hotel.mapLink}` : ""}\n(மேளா இடத்திற்கான தோராய தூரம் / Approx Distance to Mela Venue: ${hotel.distance_to_venue} Meters)\n\n*Rooms: ${roomList}*`,
                hotelPhone: hotel.phone,
                roomDetails: hotel.rooms.length > 0 ? `Room(s): ${roomList}` : "Room to be assigned",
            };
        } else {
            // Multiple hotels - format as list with rooms
            const hotelNames = hotelDetails.map(h => h.name).join(", ");
            const hotelAddresses = hotelDetails.map((h, i) => {
                const roomList = h.rooms.length > 0 ? h.rooms.join(", ") : "TBA";
                return `\n${i + 1}. ${h.name}\n   Address: ${h.address}\n   Phone: ${h.phone}${h.mapLink ? `\n(மேளா நடைபெறும் இடத்திற்கான தோராய தூரம் / Approx Distance to Mela Venue: ${h.distance_to_venue} Meters)\n   Map: ${h.mapLink}` : ""}\n\n   *Rooms: ${roomList}*`;
            }).join("\n");

            return {
                hotelName: hotelNames,
                hotelAddress: hotelAddresses,
                hotelPhone: "See addresses above",
                roomDetails: "See room details in addresses above",
            };
        }
    };

    // Payment is due 14 days after the booking date, but never later than 31 Jan 2027
    const getPaymentDueDate = () => {
        const start = bookingData.booking_date ? new Date(bookingData.booking_date) : new Date();
        const base = isNaN(start.getTime()) ? new Date() : start;
        const due = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 14);
        const lastDate = new Date(2027, 0, 31);
        return formatDate(due > lastDate ? lastDate : due);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return "0";
        return `₹${parseFloat(amount).toLocaleString("en-IN")}`;
    };

    const handleSendWhatsApp = () => {
        const whatsappNo = familyData.whatsapp || familyData.phone2;

        if (!whatsappNo) {
            toast.error("WhatsApp number not found");
            return;
        }

        // Clean the phone number (remove spaces, dashes, etc.)
        const cleanNumber = whatsappNo.toString().replace(/\D/g, "");

        // Use preview text (with filled placeholders) or empty string for blank message
        const messageToSend = previewText || messageText || "";

        // URL encode the message
        const encodedMessage = encodeURIComponent(messageToSend);

        // Construct WhatsApp URL
        const whatsappUrl = `https://wa.me/91${cleanNumber}?text=${encodedMessage}`;

        // Open WhatsApp in new window
        window.open(whatsappUrl, "_blank");

        toast.success("Opening WhatsApp...");

        // Close dialog after short delay
        setTimeout(() => {
            onClose();
        }, 500);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        Send WhatsApp Message
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Recipient Info */}
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <div className="text-sm font-semibold mb-1">Sending to:</div>
                        <div className="text-sm">
                            <span className="font-medium">{familyData.leader || "No name"}</span>
                            {" • "}
                            <span className="text-green-600">+91 {familyData.whatsapp || familyData.phone2 || "No number"}</span>
                        </div>
                    </div>

                    {/* Template Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Select Template
                        </label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map((template) => (
                                    <SelectItem key={template.value} value={template.value}>
                                        {template.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Message Editor - Hidden */}
                    {/* <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Message (with placeholders)</label>
                            {messageText && (
                                <Button variant="ghost" size="sm" onClick={handleClearMessage} className="h-7 text-xs">
                                    <X className="w-3 h-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                        <Textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type your message here or select a template above..." className="min-h-[120px] font-mono text-sm" disabled={isLoading} />
                        <div className="text-xs text-gray-500">
                            Available placeholders: {"{registrationRef}"}, {"{groupHeadName}"}, {"{phone}"}, {"{amount}"}, {"{payableAmount}"}, {"{membersDetails}"}, etc.
                        </div>
                    </div> */}

                    {/* Preview */}
                    {previewText && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-green-700">Preview (placeholders filled)</label>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                                <pre className="text-sm whitespace-pre-wrap font-sans">{previewText}</pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white" disabled={!familyData.whatsapp && !familyData.phone2}>
                        <Send className="w-4 h-4 mr-2" />
                        Send via WhatsApp
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default WhatsAppMessage;
