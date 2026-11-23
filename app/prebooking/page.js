"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Pencil, UserPlus } from "lucide-react";
import fetcher from "@/db/fetcher";
import useSWR from "swr";
import { useState } from "react";
import BookingForm from "@/components/bookingform";
import defaultBookingValues from "@/public/defaultBookingValues.json";
import WithAuth from "@/components/WithAuth";

const Family = ({ groupdata, index, onTransferToBooking, handleEditBooking }) => {
    return (
        <AccordionItem value={groupdata.id}>
            <AccordionTrigger>
                <div className="flex items-center justify-start gap-2 text-xs">
                    {`${index + 1}).`} {groupdata.preid} <span className="text-[14px] font-bold">{groupdata.name}</span>
                    {Number(groupdata.open_requests) > 0 && <span className="text-[11px] rounded bg-red-100 text-red-700 px-1">{groupdata.open_requests} change req</span>}
                </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance min-h-30 overflow-auto">
                <div className="flex flex-col gap-1 w-full h-5">
                    <div className="flex items-center justify-start gap-4 border px-2 rounded bg-blue-50 text-xs">
                        <div className="">
                            Phone: <b>{groupdata.phone}</b>
                        </div>
                        <div className="">
                            RoomType: <b>{groupdata.room_type}</b> {groupdata.rooms_plan ? JSON.stringify(groupdata.rooms_plan) : "(rooms: not set)"}
                        </div>
                        <div className="">
                            Est: <b>{groupdata.est_amount != null ? "Rs." + groupdata.est_amount : "-"}</b>{Number(groupdata.est_unpriced) ? " + single room" : ""}
                        </div>
                        <div className="">Address: {groupdata.address}</div>
                    </div>
                    <div className="flex flex-col gap-1 border p-1 px-2 rounded">
                        {groupdata.members.map((member, idx) => {
                            return (
                                <div key={`f${index}-m${idx}`} className="flex items-center jsutify-start gap-3">
                                    <div className="w-8">{idx + 1}</div>
                                    <div className="w-50">{member.name}</div>
                                    <div className="w-20">{member.phone}</div>
                                    <div className="w-8">{member.age}</div>
                                    <div className="w-8">{member.sex}</div>
                                    <div className="w-24 text-[11px]">{member.onward_train_no || "-"}/{member.return_train_no || "-"}{member.onward_pickup ? " P" : ""}{member.return_pickup ? " D" : ""}</div>
                                    <div className="">{member.photoid}</div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Transfer to Booking Button */}
                    <div className="mt-2 flex justify-start">
                        {groupdata?.mela_regn_id == null ? (
                            <Button onClick={() => onTransferToBooking(groupdata)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add to New Registration
                            </Button>
                        ) : (
                            <Button onClick={() => handleEditBooking(groupdata.mela_regn_id)} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <Pencil className="w-4 h-4 mr-2" />
                                {groupdata.mela_regn_id}
                            </Button>
                        )}
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};

const PreBookingContent = () => {
    const { data, error, isLoading,mutate } = useSWR("data/prebooking_data.php", (url) => fetcher(url, { method: "GET" }));
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [prebookingData, setPrebookingData] = useState(null);
    const [editingFamilyId, setEditingFamilyId] = useState(0);

    const transformPrebookingToBooking = (prebooking) => {
        // Map a public-form pre-registration (pandharpur_melaregn) to the booking form shape
        const dm = defaultBookingValues.member;
        const isAC = prebooking.room_type === "AC";
        const mode = prebooking.travel_mode === "TRAIN" ? "T" : "O";
        const plan = Array.isArray(prebooking.rooms_plan) ? prebooking.rooms_plan : null;
        // Non-train travellers give their own arrival / departure time at Pandharpur
        const arrAt = prebooking.arrival_at || dm.arr_time;
        const depAt = prebooking.departure_at || dm.dep_time;

        const members = prebooking.members.map((m) => ({
            memberid: dm.memberid,
            name: m.name || dm.name,
            photoid: m.photoid || dm.photoidno,
            phone: m.phone || dm.phone,
            age: m.age ?? dm.age,
            sex: m.sex || dm.sex,
            prefer: { roomtype: isAC ? "A" : "N", toilet: dm.p_toilet, floor: dm.p_floor, cot: dm.p_cot },
            arrival: { mode, train: m.onward_train_no || m.onward_other_no || dm.arr_train_no, seat: dm.arr_seat_no, time: m.onward_other_at || arrAt, city: dm.arr_city, pickup: m.onward_pickup ? 1 : 0, "check-in": dm.checkin_time },
            depature: { mode, train: m.return_train_no || m.return_other_no || dm.dep_train_no, seat: dm.dep_seat_no, time: m.return_other_at || depAt, city: dm.dep_city, drop: m.return_pickup ? 1 : 0, "check-out": dm.checkout_time },
        }));

        const volunteers = prebooking.members.filter((m) => m.volunteer).map((m) => m.name);
        const remarks = [
            prebooking.remarks || "",
            `Room: ${isAC ? "AC" : "Non-AC"}${plan ? " " + JSON.stringify(plan) : ""}`,
            prebooking.emergency_contact_name ? `Emergency: ${prebooking.emergency_contact_name} (${prebooking.emergency_contact_phone}${prebooking.emergency_contact_relation ? ", " + prebooking.emergency_contact_relation : ""})` : "",
            volunteers.length ? `Volunteers: ${volunteers.join(", ")}` : "",
        ]
            .filter(Boolean)
            .join("\n");

        const df = defaultBookingValues.family;
        return {
            family: {
                familyid: df.familyid,
                groupNo: prebooking.preid || df.groupNo,
                leader: prebooking.name || df.leader,
                city: prebooking.city || df.city,
                citygroup: df.citygroup,
                whatsapp: prebooking.whatsapp || df.whatsapp,
                phone2: prebooking.emergency_contact_phone || df.phone2,
                address: prebooking.address || df.address,
                fremarks: remarks || df.fremarks,
                roomcategory: plan ? `${prebooking.room_type}-${Math.max(...plan)}` : "",
                roomsplan: plan || [],
            },
            booking: {
                ...defaultBookingValues.booking,
                prebooking_id: prebooking.id || 0,
                // Bill amount defaults to the pre-registration estimate when not already set
                bill_amount: defaultBookingValues.booking.bill_amount || (prebooking.est_amount != null ? prebooking.est_amount : ""),
            },
            members,
        };
    };

    const handleTransferToBooking = (groupdata) => {
        const transformed = transformPrebookingToBooking(groupdata);
        setEditingFamilyId(0);
        setPrebookingData(transformed);
        setShowBookingForm(true);
    };

    const handleCloseBookingForm = () => {
        setShowBookingForm(false);
        setPrebookingData(null);
    };

    const handleEditBooking = (familyId) => {
        setEditingFamilyId(familyId);
        setShowBookingForm(true);
    };
    const handleSaveBooking = () => {
        // Handle save - will be handled by BookingForm component
        setShowBookingForm(false);
        setPrebookingData(null);
        mutate();
    };

    if (isLoading) {
        return (
            <div className="w-full border rounded-md">
                <div className="h-8 w-full flex items-center justify-between border-b px-2 font-bold bg-gray-100">Pre Booking</div>
                <div className="w-full p-1">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full border rounded-md">
                <div className="h-8 w-full flex items-center justify-between border-b px-2 font-bold bg-gray-100">Pre Booking</div>
                <div className="w-full p-1 text-red-500">Error loading data</div>
            </div>
        );
    }

    const groups = data?.data["nr"] || [];
    const regGroups = data?.data["rg"] || [];

    return (
        <div className="grid grid-cols-2 gap-1 p-2 ">
            <div className="p-2 border rounded">
                <div className="px-2 h-8 sticky top-14 z-99 border-0 bg-linear-to-l rounded-md from-amber-300 to-green-700 flex items-center text-white  font-bold text-sm sm:text-base">Pre Booking - Pending Register</div>
                <div className="w-full p-1">
                    <Accordion type="single" collapsible className="w-full">
                        {groups.map((grp, i) => (
                            <Family key={`f${i}`} groupdata={grp} index={i} onTransferToBooking={handleTransferToBooking} />
                        ))}
                    </Accordion>
                </div>
            </div>

            <div className="p-2 border rounded">
                <div className="px-2 h-8 sticky top-14 z-99 border-0 bg-linear-to-l rounded-md  from-amber-300 to-green-700 flex items-center text-white  font-bold text-sm sm:text-base">Pre Booking-Registered</div>
                <div className="w-full p-1">
                    <Accordion type="single" collapsible className="w-full">
                        {regGroups.map((grp, i) => (
                            <Family key={`f${i}`} groupdata={grp} index={i} handleEditBooking={handleEditBooking} />
                        ))}
                    </Accordion>
                </div>
            </div>

            {/* Booking Form Modal */}
            {showBookingForm && prebookingData && <BookingForm open={showBookingForm} familyId={0} initialData={prebookingData} onSave={handleSaveBooking} onCancel={handleCloseBookingForm} />}
            {showBookingForm && editingFamilyId && <BookingForm open={showBookingForm} familyId={editingFamilyId} onSave={handleSaveBooking} onCancel={handleCloseBookingForm} />}
        </div>
    );
};


const PreBookingView = () => {
    return (
        <WithAuth>
            <PreBookingContent />
        </WithAuth>
    );
};

export default PreBookingView;
