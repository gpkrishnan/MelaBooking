"use client";

import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import fetcher from "@/db/fetcher";
import DevoteeSuggest from "@/components/DevoteeSuggest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Phone, MessageSquare, Home, Users, Calendar, DollarSign, Receipt, Bed, Plus, Save, ArrowLeft, Trash2, Edit, X, CircleUser, Send, SendHorizonal } from "lucide-react";
import MemberFormDialog from "@/components/MemberFormDialog";
import RoomAssignmentDialog from "@/components/RoomAssignmentDialog";
import RoomSelector from "@/components/RoomSelector";
import RoomBedAssignment from "@/components/RoomBedAssignment";
import PhotoIdBadge from "@/components/PhotoIdBadge";
import WhatsAppMessage from "@/components/WhatsAppMessage";
import RateCard from "@/components/RateCard";
import { toast } from "sonner";

import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { formatHotelName } from "@/lib/formatHotelName";

// Room fields: 1) kind AC / NAC / DOR  2) number of rooms  3) beds per room type  4) people in each room.
// The stored values stay as before: room_category = "AC-3" / "NAC-2" / "Dormitary", plus rooms_plan = people per room.
const ROOM_KINDS = [
    { value: "AC", label: "AC" },
    { value: "NAC", label: "Non AC" },
    { value: "DOR", label: "Dormitory" },
];
const BED_TYPES = ["2", "3", "4", "5", "6"];
const parseRoomCategory = (cat) => {
    if (/^dorm/i.test(cat || "")) return { kind: "DOR", beds: "" };
    const m = /^(N?AC)-(\d+)$/i.exec(cat || "");
    return m ? { kind: m[1].toUpperCase(), beds: m[2] } : { kind: "", beds: "" };
};
const buildRoomCategory = (kind, beds) => (kind === "DOR" ? "Dormitary" : kind && beds ? `${kind}-${beds}` : "");
const planToArray = (plan) => (Array.isArray(plan) ? plan : String(plan || "").split(/[^0-9]+/).filter(Boolean)).map(String);
const splitEvenly = (total, rooms) => Array.from({ length: rooms }, (_, i) => String(Math.floor(total / rooms) + (i < total % rooms ? 1 : 0)));
// Adds the room fields to a family object without changing what is stored (roomtouched stays false until the user edits them).
const withRoomFields = (f, touched = false) => {
    const { kind, beds } = parseRoomCategory(f.roomcategory);
    const plan = kind === "DOR" ? [] : planToArray(f.roomsplan);
    return { ...f, roomkind: kind, roombeds: beds, roomsplan: plan, roomcount: plan.length ? String(plan.length) : "", roomtouched: touched && (kind !== "" || plan.length > 0) };
};

const BookingForm = ({ open = false, familyId = 0, initialData, onSave, onCancel }) => {
    // Helper function to convert "Feb 19,2025 04:00 AM" to datetime-local format "2025-02-19T04:00"
    const formatToDateTimeLocal = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "";
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            return "";
        }
    };

    // Helper function to convert datetime-local "2025-02-19T04:00" to "Feb 19,2025 04:00 AM"

    const formatFromDateTimeLocal = (dateTimeLocal) => {
        if (!dateTimeLocal) return "";
        try {
            const date = new Date(dateTimeLocal);
            if (isNaN(date.getTime())) return "";
            const options = {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            };
            return date.toLocaleString("en-US", options).replace(",", "");
        } catch (e) {
            return "";
        }
    };

    // Helper function to convert "Sep 25,2024" to date input format "2024-09-25"
    const formatToDate = (dateStr) => {
        if (!dateStr) return "";
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "";
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        } catch (e) {
            return "";
        }
    };

    // Helper function to convert date input "2024-09-25" to "Sep 25,2024"
    const formatFromDate = (dateInput) => {
        if (!dateInput) return "";
        try {
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return "";
            const options = {
                year: "numeric",
                month: "short",
                day: "numeric",
            };
            return date.toLocaleString("en-US", options).replace(",", "");
        } catch (e) {
            return "";
        }
    };

    // Load default values from JSON file
    const { data: defaultValues } = useSWR(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/defaultBookingValues.json`, (url) => fetch(url).then((res) => res.json()), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // Family state
    const [family, setFamily] = useState({
        familyid: 0,
        groupNo: "New",
        leader: "",
        city: "",
        citygroup: 1,
        whatsapp: "",
        phone2: "",
        address: "",
        fremarks: "",
        roomcategory: "",
        roomkind: "",
        roombeds: "",
        roomcount: "",
        roomsplan: [],
        roomtouched: false,
        shareref: "",
        sharename: "",
        combineno: null,
        sharetouched: false,
    });

    // Members state
    const [members, setMembers] = useState([]);
    const [saving, setSaving] = useState(false); // blocks double-clicks on Save
    const [bookingNo, setBookingNo] = useState(""); // admin-chosen booking number (1-100) for a brand-new booking
    const submitTokenRef = useRef(null); // one token per opened new-booking form: repeats are recognised by the server
    const [editingMember, setEditingMember] = useState(null);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [memberFormKey, setMemberFormKey] = useState(0); // Force re-render of member form

    // Room assignment state (old approach - will be removed)
    const [showRoomDialog, setShowRoomDialog] = useState(false);
    const [assigningMemberIndex, setAssigningMemberIndex] = useState(null);

    // Rooms tab state
    const [selectedRooms, setSelectedRooms] = useState([]); // Array of room IDs
    const [showRoomSelector, setShowRoomSelector] = useState(false);
    const [roomAssignments, setRoomAssignments] = useState({}); // { bedId: memberIndex }

    // WhatsApp message state
    const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
    const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState("blank");

    // Booking/Payment state
    const [booking, setBooking] = useState({
        booking_date: "",
        bill_amount: "",
        recd_amount: "",
        receipt_date: "",
        pay_mode: "",
        pay_detail: "",
        booking_status: "",
        receipt_no: "",
        ledger_id: "",
        prebooking_id: 0,
    });

    // Load city groups with SWR
    const { data: cityGroups = [] } = useSWR("data/citygroups.php", (url) => fetcher(url, { method: "GET" }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // Load room data with SWR for Rooms tab
    const { data: roomData = [] } = useSWR("data/room.php", (url) => fetcher(url, { method: "GET" }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // Single-person bookings this booking can share a room with (same room category, room not full)
    const { data: shareCandidates = [] } = useSWR(
        members.length === 1 && family.roomcategory && family.roomkind !== "DOR" ? ["data/share_candidates.php", familyId || 0, family.roomcategory] : null,
        ([url, id, cat]) => fetcher(url, { method: "POST", data: { familyid: id, room_category: cat } }),
        { revalidateOnFocus: false }
    );

    // Member form state - will be initialized from defaultValues
    const [memberForm, setMemberForm] = useState({
        memberid: 0,
        name: "",
        photoidno: "",
        phone: "",
        age: "",
        sex: "M",
        p_roomtype: "N",
        p_toilet: "N",
        p_cot: "N",
        p_floor: "N",
        arr_mode: "T",
        arr_train_no: "",
        arr_seat_no: "-",
        arr_time: "",
        arr_city: "",
        pickup_bus: 1,
        checkin_time: "",
        checkout_time: "",
        dep_mode: "T",
        dep_train_no: "",
        dep_seat_no: "",
        dep_time: "",
        dep_city: "",
        drop_bus: 1,
    });

    // Load family data with SWR
    const { data: familyData } = useSWR(familyId && familyId !== 0 ? ["data/singlefamily.php", familyId] : null, ([url, id]) => fetcher(url, { method: "POST", data: { familyid: id } }), {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    // Update form state when family data is loaded
    useEffect(() => {
        if (familyData && familyData.length > 0) {
            const fData = familyData[0];

            setFamily(withRoomFields({
                familyid: fData.id,
                groupNo: fData.groupNo || "",
                leader: fData.name || "",
                city: fData.city || "",
                citygroup: fData.citygroup || 1,
                whatsapp: fData.whatsapp || "",
                phone2: fData.phone || "",
                address: fData.address || "",
                fremarks: fData.fremarks || "",
                roomcategory: fData.room_category || "",
                roomsplan: fData.rooms_plan || [],
                shareref: fData.share_ref || "",
                sharename: fData.share_name || "",
                combineno: fData.combine_no || null,
                sharetouched: false,
            }));

            if (fData.brn) {
                setBooking({
                    booking_date: fData.brn.booking_date || "",
                    bill_amount: fData.brn.bill_amount || "",
                    recd_amount: fData.brn.recd_amount || "",
                    receipt_date: fData.brn.receipt_date || "",
                    pay_mode: fData.brn.pay_mode || "",
                    pay_detail: fData.brn.pay_detail || "",
                    booking_status: fData.brn.booking_status || "",
                    receipt_no: fData.brn.RECEIPT_NO || "",
                    ledger_id: fData.brn.LE_ID || "",
                });
            }

            if (fData.members) {
                setMembers(fData.members);

                // Extract room assignments from members
                const bedAssigns = {};

                fData.members.forEach((member, memberIndex) => {
                    if (member.bed && member.bed.bedid) {
                        // Add bed assignment
                        bedAssigns[member.bed.bedid] = memberIndex;
                    }
                });

                setRoomAssignments(bedAssigns);
            }
        } else if ((familyId === 0 || !familyId) && defaultValues) {
            // Reset form for new booking using defaults from JSON
            setFamily(withRoomFields(defaultValues.family));
            setMembers([]);
            setSelectedRooms([]);
            setRoomAssignments({});
            setBooking(defaultValues.booking);
        }
    }, [familyData, familyId, defaultValues]);

    // Reset form when dialog opens/closes or familyId changes
    useEffect(() => {
        if (!open) {
            // Don't reset when closing - let parent handle it
            return;
        }

        // When opening with familyId=0 and NO initialData, ensure clean state for new booking
        if (familyId === 0 && !initialData && defaultValues) {
            setFamily(withRoomFields(defaultValues.family));
            setMembers([]);
            setSelectedRooms([]);
            setRoomAssignments({});
            setBooking(defaultValues.booking);
        }
    }, [open, familyId, initialData, defaultValues]);

    // Populate form with initialData when provided (for prebooking transfer)
    useEffect(() => {
        if (open && initialData && familyId === 0 && defaultValues) {
            // Set family data from initialData
            if (initialData.family) {
                setFamily(withRoomFields(initialData.family, true));
            }

            // Set members data from initialData
            if (initialData.members && initialData.members.length > 0) {
                setMembers(initialData.members);
            }

            // Set booking data from initialData (includes prebooking_id) or use defaults
            if (initialData.booking) {
                setBooking(initialData.booking);
            } else {
                setBooking(defaultValues.booking);
            }

            // Clear room assignments (user will assign manually)
            setRoomAssignments({});
            setSelectedRooms([]);
        }
    }, [open, initialData, familyId, defaultValues]);

    // Default booking date to today when it is empty (new, pre-booking transfer, or existing booking without one)
    useEffect(() => {
        if (!open) return;
        setBooking((prev) => (prev.booking_date ? prev : { ...prev, booking_date: formatFromDate(formatToDate(new Date())) }));
    }, [open, initialData, familyId, familyData, defaultValues]);

    // Auto-select rooms based on bed assignments (runs when assignments change)
    useEffect(() => {
        if (roomData && roomData.length > 0) {
            const roomIds = new Set();

            // Only add rooms if there are bed assignments
            if (Object.keys(roomAssignments).length > 0) {
                // Find rooms that contain our assigned beds
                roomData.forEach((hotel) => {
                    hotel.floor.forEach((floor) => {
                        floor.rooms.forEach((room) => {
                            // Check if any bed in this room is assigned
                            const hasAssignment = room.cot.some((cot) => cot.bed.some((bed) => roomAssignments[bed.id] !== undefined));

                            if (hasAssignment) {
                                roomIds.add(room.roomid); // Use roomid from backend
                            }
                        });
                    });
                });
            }

            // Update selectedRooms to sync with current assignments
            // Only runs when roomAssignments changes, not when roomData is fetched
            setSelectedRooms(Array.from(roomIds));
        }
    }, [roomAssignments]); // Removed roomData to prevent auto-selection when "Add Room" dialog opens

    const handleFamilyChange = (field, value) => {
        setFamily((prev) => ({ ...prev, [field]: value }));
    };

    // Editing any room field marks the room split as changed, so it is saved; untouched bookings keep their stored values.
    const handleRoomChange = (patch) => {
        setFamily((prev) => {
            const f = { ...prev, ...patch, roomtouched: true };
            if ("roomkind" in patch) {
                if (f.roomkind === "DOR") {
                    f.roombeds = "";
                    f.roomcount = "";
                    f.roomsplan = [];
                } else if (!f.roomcount) {
                    f.roomcount = "1";
                    f.roomsplan = members.length ? splitEvenly(members.length, 1) : [""];
                }
            }
            if ("roomcount" in patch) {
                const n = Math.max(0, Math.min(10, parseInt(f.roomcount, 10) || 0));
                f.roomcount = n ? String(n) : "";
                f.roomsplan = n ? (members.length ? splitEvenly(members.length, n) : Array(n).fill("")) : [];
            }
            f.roomcategory = buildRoomCategory(f.roomkind, f.roombeds);
            return f;
        });
    };

    const handleBookingChange = (field, value) => {
        setBooking((prev) => ({ ...prev, [field]: value }));
    };

    const addNewMember = () => {
        // Use default values from JSON, override name and phone for first member
        const newMember = {
            ...defaultValues?.member,
            memberid: 0,
            name: members.length === 0 ? family.leader : "",
            phone: family.whatsapp,
        };

        setMemberForm(newMember);
        setEditingMember(null);
        setShowMemberForm(true);
    };

    const editMember = (index) => {
        const member = members[index];
        const defaults = defaultValues?.member || {};

        // Map nested API structure to flat form structure, using JSON defaults as fallback
        setMemberForm({
            memberid: member.memberid || 0,
            name: member.name || "",
            photoidno: member.photoidno || member.photoid || defaults.photoidno || "",
            phone: member.phone || "",
            age: member.age || "",
            sex: member.sex || defaults.sex || "M",
            p_roomtype: member.prefer?.roomtype || member.p_roomtype || defaults.p_roomtype || "N",
            p_toilet: member.prefer?.toilet || member.p_toilet || defaults.p_toilet || "N",
            p_cot: member.prefer?.cot || member.p_cot || defaults.p_cot || "N",
            p_floor: member.prefer?.floor || member.p_floor || defaults.p_floor || "N",
            arr_mode: member.arrival?.mode || member.arr_mode || defaults.arr_mode || "T",
            arr_train_no: member.arrival?.train || member.arr_train_no || defaults.arr_train_no || "",
            arr_seat_no: member.arrival?.seat || member.arr_seat_no || defaults.arr_seat_no || "-",
            arr_time: member.arrival?.time || member.arr_time || defaults.arr_time || "",
            arr_city: member.arrival?.city || member.arr_city || defaults.arr_city || "",
            pickup_bus: member.arrival?.pickup || member.pickup_bus || defaults.pickup_bus || 1,
            checkin_time: member.arrival?.["check-in"] || member.checkin_time || defaults.checkin_time || "",
            checkout_time: member.depature?.["check-out"] || member.checkout_time || defaults.checkout_time || "",
            dep_mode: member.depature?.mode || member.dep_mode || defaults.dep_mode || "T",
            dep_train_no: member.depature?.train || member.dep_train_no || defaults.dep_train_no || "",
            dep_seat_no: member.depature?.seat || member.dep_seat_no || defaults.dep_seat_no || "",
            dep_time: member.depature?.time || member.dep_time || defaults.dep_time || "",
            dep_city: member.depature?.city || member.dep_city || defaults.dep_city || "",
            drop_bus: member.depature?.drop || member.drop_bus || defaults.drop_bus || 1,
        });

        setEditingMember(index);
        setShowMemberForm(true);
    };

    const handleSaveMember = (formData) => {
        // Convert flat form structure back to nested API structure
        const memberData = {
            memberid: formData.memberid,
            name: formData.name,
            photoid: formData.photoidno,
            phone: formData.phone,
            age: formData.age,
            sex: formData.sex,
            prefer: {
                roomtype: formData.p_roomtype,
                toilet: formData.p_toilet,
                floor: formData.p_floor,
                cot: formData.p_cot,
            },
            arrival: {
                mode: formData.arr_mode,
                time: formData.arr_time,
                train: formData.arr_train_no,
                city: formData.arr_city,
                seat: formData.arr_seat_no,
                pickup: formData.pickup_bus,
                "check-in": formData.checkin_time,
            },
            depature: {
                "check-out": formData.checkout_time,
                mode: formData.dep_mode,
                time: formData.dep_time,
                train: formData.dep_train_no,
                city: formData.dep_city,
                seat: formData.dep_seat_no,
                drop: formData.drop_bus,
            },
        };

        if (editingMember !== null) {
            const updatedMembers = [...members];
            // Preserve bed data if it exists
            if (members[editingMember].bed) {
                memberData.bed = members[editingMember].bed;
            }
            updatedMembers[editingMember] = memberData;
            setMembers(updatedMembers);
        } else {
            setMembers([...members, memberData]);
        }
        setShowMemberForm(false);
        setEditingMember(null); // Reset editing member
        setMemberFormKey((prev) => prev + 1); // Force new form instance
    };

    const handleDeleteMember = async () => {
        if (editingMember === null) return;

        const member = members[editingMember];
        if (!window.confirm(`Do you want to delete ${member.name}?`)) return;

        if (member.memberid && member.memberid !== 0) {
            const result = await fetcher("actions/deletemember.php", {
                method: "POST",
                data: { memberid: member.memberid },
            });

            // Handle JSON response
            if (result.success) {
                if (onSave) onSave(result.familyid);
                toast.success(result.message || "Member deleted successfully!");
            } else {
                toast.error(result.message + (result.error ? ": " + result.error : ""));
                return; // Don't proceed if API call failed
            }
        }

        const updatedMembers = members.filter((_, i) => i !== editingMember);
        setMembers(updatedMembers);

        // Close the member form after deletion
        setShowMemberForm(false);
        setEditingMember(null);
    };

    const handleSave = async () => {
        if (saving) return;
        if (!family.leader || !family.city || !family.whatsapp) {
            toast.error("Please fill all required fields (Leader name, City, WhatsApp)");
            return;
        }
        const isAdminNew = familyId === 0 && !booking.prebooking_id;
        const no = Number(bookingNo);
        if (isAdminNew && (!Number.isInteger(no) || no < 1 || no > 100)) {
            toast.error("Enter a booking number between 1 and 100");
            return;
        }

        const roomsEdited = family.roomtouched || familyId === 0;
        if (roomsEdited && family.roomkind && family.roomkind !== "DOR") {
            const plan = family.roomsplan.map((n) => parseInt(n, 10));
            if (!family.roombeds) {
                toast.error("Select the room type (2 Bed, 3 Bed ...)");
                return;
            }
            if (!plan.length || plan.some((n) => !(n >= 1))) {
                toast.error("Enter the number of persons for every room");
                return;
            }
            const total = plan.reduce((a, b) => a + b, 0);
            if (total !== members.length) {
                toast.error(`Persons in rooms (${total}) must match the persons booked (${members.length})`);
                return;
            }
        }

        if (!submitTokenRef.current) submitTokenRef.current = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, "").slice(0, 32);
        setSaving(true);
        try {
            // Structure data to match PHP backend expectations
            const saveData = {
                id: family.familyid || 0,
                submit_token: family.familyid ? null : submitTokenRef.current,
                prebooking_id: booking.prebooking_id || 0,
                requested_id: isAdminNew ? no : 0,
                name: family.leader,
                city: family.city,
                citygroup: family.citygroup,
                whatsapp: family.whatsapp,
                phone: family.phone2,
                fremarks: family.fremarks,
                address: family.address,
                roomcategory: family.roomcategory,
                ...(roomsEdited && family.roomkind ? { roomsplan: family.roomkind === "DOR" ? "" : family.roomsplan.join("+") } : {}),
                ...(family.sharetouched ? { share_ref: members.length === 1 ? family.shareref.trim() : "" } : {}),
                brn: {
                    booking_date: formatFromDate(booking.booking_date || formatToDate(new Date())),
                    bill_amount: booking.bill_amount || 0,
                    recd_amount: booking.recd_amount || 0,
                    receipt_date: formatFromDate(booking.receipt_date),
                    pay_mode: booking.pay_mode,
                    pay_detail: booking.pay_detail,
                    booking_status: booking.booking_status || "R",
                },
                members: members.map((member) => ({
                    memberid: member.memberid || 0,
                    name: member.name,
                    photoid: member.photoid || "",
                    phone: member.phone,
                    sex: member.sex,
                    age: member.age,
                    prefer: {
                        roomtype: member.prefer?.roomtype || "N",
                        toilet: member.prefer?.toilet || "N",
                        floor: member.prefer?.floor || "G",
                        cot: member.prefer?.cot || "S",
                    },
                    bed: {
                        bedid: member.bed?.bedid || null,
                    },
                    arrival: {
                        mode: member.arrival?.mode || "T",
                        train: member.arrival?.train || "",
                        time: member.arrival?.time || "",
                        city: member.arrival?.city || "",
                        seat: member.arrival?.seat || "-",
                        pickup: member.arrival?.pickup || 0,
                        "check-in": member.arrival?.["check-in"] || "",
                    },
                    depature: {
                        "check-out": member.depature?.["check-out"] || "",
                        mode: member.depature?.mode || "T",
                        time: member.depature?.time || "",
                        train: member.depature?.train || "",
                        city: member.depature?.city || "",
                        seat: member.depature?.seat || "-",
                        drop: member.depature?.drop || 0,
                    },
                })),
            };

            const result = await fetcher("actions/updatefamily.php", {
                method: "POST",
                data: saveData,
            });

            // Handle JSON response
            if (result.success) {
                submitTokenRef.current = null;
                if (onSave) onSave(result.familyid);
                toast.success(result.duplicate_submit ? "Already saved (duplicate click ignored)" : result.message || "Booking saved successfully!");
                const cs = result.contacts_sync;
                if (cs && (cs.status === "failed" || cs.status === "partial")) {
                    toast.error("Booking saved, but Google Contacts sync " + (cs.status === "partial" ? "was partial" : "failed") + ": " + (cs.errors?.[0] || ""), { duration: 10000 });
                }
            } else if (result.code === "DUPLICATE") {
                toast.error(result.message || "Duplicate booking", { duration: 10000 });
            } else {
                toast.error(result.message + (result.error ? ": " + result.error : ""));
            }
        } catch (error) {
            console.error("Error saving:", error);
            toast.error("Connection error: " + (error.message || "Failed to save booking"));
        } finally {
            setSaving(false);
        }
    };

    const handleCloseMemberForm = () => {
        setShowMemberForm(false);
        setEditingMember(null);
    };

    const openRoomAssignment = (index) => {
        setAssigningMemberIndex(index);
        setShowRoomDialog(true);
    };

    const handleBedAssignment = (bedAssignment) => {
        if (assigningMemberIndex === null) return;

        const updatedMembers = [...members];
        updatedMembers[assigningMemberIndex] = {
            ...updatedMembers[assigningMemberIndex],
            bed: {
                bedid: bedAssignment.bedid,
                ...bedAssignment.bedData,
            },
        };
        setMembers(updatedMembers);
        setShowRoomDialog(false);
        setAssigningMemberIndex(null);
        toast.success("Bed assigned successfully!");
    };

    const handleRemoveBed = (index, e) => {
        e.stopPropagation(); // Prevent card click

        const k = confirm("Are you sure of removing the room assignment?");
        if (!k) return;
        const updatedMembers = [...members];
        updatedMembers[index] = {
            ...updatedMembers[index],
            bed: {
                bedid: null,
            },
        };
        setMembers(updatedMembers);
        toast.success("Room assignment removed");
    };

    // Room management handlers
    const handleToggleRoom = (roomId) => {
        setSelectedRooms((prev) => {
            if (prev.includes(roomId)) {
                // Remove room and its bed assignments
                const newAssignments = { ...roomAssignments };
                // Find all beds in this room and remove assignments
                roomData.forEach((hotel) => {
                    hotel.floor.forEach((floor) => {
                        floor.rooms.forEach((room) => {
                            if (room.roomid === roomId) {
                                room.cot.forEach((cot) => {
                                    cot.bed.forEach((bed) => {
                                        delete newAssignments[bed.id];
                                    });
                                });
                            }
                        });
                    });
                });
                setRoomAssignments(newAssignments);
                return prev.filter((id) => id !== roomId);
            } else {
                return [...prev, roomId];
            }
        });
    };

    const handleRemoveRoom = (roomId) => {
        handleToggleRoom(roomId);
        toast.success("Room removed");
    };

    const handleAssignBedInRoom = (bedId, memberIndex) => {
        setRoomAssignments((prev) => {
            const newAssignments = { ...prev };

            if (memberIndex === null) {
                // Clearing assignment from this bed
                delete newAssignments[bedId];
            } else {
                // Find and remove any existing assignment for this member
                for (const [existingBedId, existingMemberIndex] of Object.entries(newAssignments)) {
                    if (existingMemberIndex === memberIndex) {
                        delete newAssignments[existingBedId];
                        break;
                    }
                }

                // Assign member to new bed
                newAssignments[bedId] = memberIndex;
            }
            return newAssignments;
        });

        // Update member's bed assignment
        if (memberIndex !== null) {
            const updatedMembers = [...members];
            updatedMembers[memberIndex] = {
                ...updatedMembers[memberIndex],
                bed: {
                    bedid: bedId,
                },
            };
            setMembers(updatedMembers);
        }
    };

    const handleWhatsApp = (templateType) => {
        // Map the button number to template value
        const templateMap = {
            1: "blank",
            2: "registration",
            3: "reminder",
            4: "booking",
            5: "roomdetails",
            6: "modification",
            7: "cancelation"
        };

        // Set the selected template and open dialog
        setSelectedWhatsAppTemplate(templateMap[templateType] || "blank");
        setShowWhatsAppDialog(true);
    };

    if (!open) return null;

    return (
        <>
            {/* Full screen overlay */}
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                {/* Booking form container */}
                <div className="bg-white rounded-lg shadow-xl w-full max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-6 h-6" />
                            {family.familyid ? `${family.groupNo}` : "New Booking"}
                        </h2>
                        <button onClick={() => !showMemberForm && onCancel()} className="text-gray-500 hover:text-gray-700" disabled={showMemberForm}>
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <Tabs defaultValue="family" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="family">Family Details</TabsTrigger>
                                <TabsTrigger value="members">Members</TabsTrigger>
                                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                                <TabsTrigger value="payment">Payment</TabsTrigger>
                            </TabsList>

                            {/* Family Details Tab */}
                            <TabsContent value="family" className="space-y-4 mt-4">
                                {familyId === 0 && !booking.prebooking_id && (
                                    <div className="max-w-xs">
                                        <Label htmlFor="bookingno">Booking No. (1 - 100) *</Label>
                                        <Input id="bookingno" type="number" min="1" max="100" value={bookingNo} onChange={(e) => setBookingNo(e.target.value)} placeholder="1 to 100" />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="leader" className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Contact Person Name *
                                        </Label>
                                        <Input id="leader" value={family.leader} onChange={(e) => handleFamilyChange("leader", e.target.value)} placeholder="Contact person name" />
                                    </div>
                                    <div>
                                        <Label htmlFor="city" className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            City *
                                        </Label>
                                        <Input id="city" value={family.city} onChange={(e) => handleFamilyChange("city", e.target.value)} placeholder="City" />
                                    </div>
                                    <div>
                                        <Label htmlFor="citygrp">City Group</Label>
                                        <Select value={family.citygroup.toString()} onValueChange={(value) => handleFamilyChange("citygroup", parseInt(value))}>
                                            <SelectTrigger id="citygrp">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cityGroups.map((group) => (
                                                    <SelectItem key={group.citygrpid} value={group.citygrpid.toString()}>
                                                        {group.groupname}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            WhatsApp *
                                        </Label>
                                        <Input id="whatsapp" value={family.whatsapp} onChange={(e) => handleFamilyChange("whatsapp", e.target.value)} placeholder="WhatsApp number" />
                                        <DevoteeSuggest
                                            by="whatsapp"
                                            value={family.whatsapp}
                                            onPick={(p) => {
                                                if (!family.leader && p.name) handleFamilyChange("leader", p.name);
                                                if (!family.city && p.city) handleFamilyChange("city", p.city);
                                                if (!family.address && p.address) handleFamilyChange("address", p.address);
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className="flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            Phone
                                        </Label>
                                        <Input id="phone" value={family.phone2} onChange={(e) => handleFamilyChange("phone2", e.target.value)} placeholder="Phone number" />
                                    </div>
                                    <div>
                                        <Label htmlFor="address" className="flex items-center gap-2">
                                            <Home className="w-4 h-4" />
                                            Address
                                        </Label>
                                        <Textarea id="address" value={family.address} onChange={(e) => handleFamilyChange("address", e.target.value)} placeholder="Address" rows={3} />
                                    </div>
                                    <div>
                                        <Label htmlFor="remarks">Remarks</Label>
                                        <Textarea id="remarks" value={family.fremarks} onChange={(e) => handleFamilyChange("fremarks", e.target.value)} placeholder="Remarks" rows={3} />
                                    </div>
                                    <div className="space-y-3 rounded-md border p-3">
                                        <Label className="flex items-center gap-2">
                                            <Bed className="w-4 h-4" />
                                            Rooms
                                        </Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <Label htmlFor="roomkind" className="text-xs">1. Room category</Label>
                                                <Select value={family.roomkind || ""} onValueChange={(value) => handleRoomChange({ roomkind: value })}>
                                                    <SelectTrigger id="roomkind">
                                                        <SelectValue placeholder={family.roomcategory || "Select"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ROOM_KINDS.map((k) => (
                                                            <SelectItem key={k.value} value={k.value}>
                                                                {k.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {family.roomkind && family.roomkind !== "DOR" && (
                                                <>
                                                    <div>
                                                        <Label htmlFor="roomcount" className="text-xs">2. No of rooms</Label>
                                                        <Select value={family.roomcount || ""} onValueChange={(value) => handleRoomChange({ roomcount: value })}>
                                                            <SelectTrigger id="roomcount">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((n) => (
                                                                    <SelectItem key={n} value={n}>
                                                                        {n}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="roombeds" className="text-xs">3. Room type</Label>
                                                        <Select value={family.roombeds || ""} onValueChange={(value) => handleRoomChange({ roombeds: value })}>
                                                            <SelectTrigger id="roombeds">
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {BED_TYPES.map((n) => (
                                                                    <SelectItem key={n} value={n}>
                                                                        {n} Bed
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        {family.roomkind && family.roomkind !== "DOR" && family.roomsplan.length > 0 && (
                                            <div>
                                                <Label className="text-xs">4. No of persons in each room (total must be {members.length})</Label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                                                    {family.roomsplan.map((n, i) => (
                                                        <div key={i} className="flex items-center gap-2">
                                                            <span className="text-xs whitespace-nowrap">Room {i + 1}</span>
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={n}
                                                                onChange={(e) => handleRoomChange({ roomsplan: family.roomsplan.map((v, j) => (j === i ? e.target.value : v)) })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Total {family.roomsplan.reduce((a, b) => a + (parseInt(b, 10) || 0), 0)} of {members.length} persons booked
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {members.length === 1 && family.roomkind && family.roomkind !== "DOR" && (
                                        <div className="rounded-md border p-3">
                                            <Label htmlFor="shareref">
                                                Share room with other single-person bookings{family.combineno ? ` (Combine No ${family.combineno})` : ""}
                                            </Label>
                                            <Select
                                                value={family.shareref || "none"}
                                                onValueChange={(value) => setFamily((prev) => ({ ...prev, shareref: value === "none" ? "" : value, sharetouched: true }))}
                                            >
                                                <SelectTrigger id="shareref">
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None (not sharing)</SelectItem>
                                                    {family.shareref && !shareCandidates.some((c) => c.ref === family.shareref) && (
                                                        <SelectItem value={family.shareref}>{family.shareref}</SelectItem>
                                                    )}
                                                    {shareCandidates.map((c) => (
                                                        <SelectItem key={c.ref} value={c.ref}>
                                                            {c.id} - {c.name}
                                                            {c.combine_no ? ` (Combine No ${c.combine_no})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {family.sharename && !family.sharetouched ? `Sharing with ${family.sharename}. ` : ""}Pick any booking already in the room; up to the room capacity can be combined. Cancelling a booking removes it from the group.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Members Tab */}
                            <TabsContent value="members" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Members ({members.length})</h3>
                                    <Button onClick={addNewMember}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Member
                                    </Button>
                                </div>
                                <div className="w-full">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Photo ID</TableHead>
                                                <TableHead>Bed Assignment</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {members.length > 0 ? (
                                                members.map((member, index) => (
                                                    <TableRow key={index} className="hover:bg-gray-50 cursor-pointer">
                                                        <TableCell>{index + 1}</TableCell>

                                                        <TableCell onClick={() => editMember(index)} className="font-semibold">
                                                            {member.name}
                                                        </TableCell>

                                                        <TableCell className="text-sm text-gray-600 flex gap-1 items-center">
                                                            {member.sex === "M" ? <CircleUser size={14} className="text-blue-600" /> : <CircleUser size={14} className="text-pink-600" />} {member.age} yrs
                                                        </TableCell>

                                                        <TableCell className="text-sm text-gray-500">{member.phone ? <> {member.phone}</> : "-"}</TableCell>

                                                        <TableCell onClick={() => editMember(index)}>
                                                            <PhotoIdBadge photoid={member.photoid} />
                                                        </TableCell>

                                                        <TableCell>
                                                            {member.bed && member.bed.bedid ? (
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                        <Bed className="w-3 h-3" />
                                                                        <span>
                                                                            {formatHotelName(member.bed.lodge) || "N/A"} - Room {member.bed.roomno || member.bed.name || "N/A"}
                                                                        </span>
                                                                        <span>{member.prefer?.roomtype === "A" ? "AC" : member.prefer?.roomtype === "N" ? "Non-AC" : "Dormitory"}</span>
                                                                    </div>
                                                                    <button onClick={(e) => handleRemoveBed(index, e)} className="text-red-500 hover:text-red-700" title="Remove bed assignment">
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">—</span>
                                                            )}
                                                        </TableCell>

                                                        <TableCell className="text-right">
                                                            <button onClick={() => editMember(index)} className="text-gray-400 hover:text-gray-600" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                        No members added yet. Click "Add Member" to start.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* Rooms Tab */}
                            <TabsContent value="rooms" className="space-y-4 mt-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Room Assignments</h3>
                                    <Button onClick={() => setShowRoomSelector(true)} className="bg-green-600 hover:bg-green-700">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Room
                                    </Button>
                                </div>

                                {/* Room Bed Assignment Component */}
                                <RoomBedAssignment familyId={family.familyid} selectedRoomIds={selectedRooms} members={members} bedAssignments={roomAssignments} onAssignBed={handleAssignBedInRoom} onRemoveRoom={handleRemoveRoom} />
                            </TabsContent>

                            {/* Payment Tab */}
                            <TabsContent value="payment" className="space-y-4 mt-4">
                                <RateCard />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="bookdate" className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Booking Date
                                        </Label>
                                        <Input id="bookdate" type="date" value={formatToDate(booking.booking_date)} onChange={(e) => handleBookingChange("booking_date", formatFromDate(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="bookamt" className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Bill Amount
                                        </Label>
                                        <Input id="bookamt" type="number" value={booking.bill_amount} onChange={(e) => handleBookingChange("bill_amount", e.target.value)} placeholder="Total Payable Amount" />
                                    </div>
                                    <div>
                                        <Label htmlFor="rcptamt">Receipt Amount</Label>
                                        <Input id="rcptamt" type="number" value={booking.recd_amount} onChange={(e) => handleBookingChange("recd_amount", e.target.value)} placeholder="Total Amount Received" />
                                    </div>
                                    <div>
                                        <Label htmlFor="rcptdt">Receipt Date</Label>
                                        <Input id="rcptdt" type="date" value={formatToDate(booking.receipt_date)} onChange={(e) => handleBookingChange("receipt_date", formatFromDate(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="rcptmode">Receipt Mode</Label>
                                        <Select value={booking.pay_mode} onValueChange={(value) => handleBookingChange("pay_mode", value)}>
                                            <SelectTrigger id="rcptmode">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="B">Bank Transfer</SelectItem>
                                                <SelectItem value="C">Cash Payment</SelectItem>
                                                <SelectItem value="O">Others</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="bookstatus">Booking Status</Label>
                                        <Select value={booking.booking_status} onValueChange={(value) => handleBookingChange("booking_status", value)}>
                                            <SelectTrigger id="bookstatus">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="R">Registered</SelectItem>
                                                <SelectItem value="B">Booked</SelectItem>
                                                <SelectItem value="C">Booking Canceled</SelectItem>
                                                <SelectItem value="A">Blocked By Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="rcptdet" className="flex items-center gap-2">
                                            <Receipt className="w-4 h-4" />
                                            Receipt Details
                                        </Label>
                                        <Textarea id="rcptdet" value={booking.pay_detail} onChange={(e) => handleBookingChange("pay_detail", e.target.value)} placeholder="Receipt Transaction Number" rows={2} />
                                    </div>
                                    {booking.receipt_no && (
                                        <div>
                                            <Label>Receipt No.</Label>
                                            <div className="text-sm font-mono bg-gray-100 p-2 rounded">{booking.receipt_no}</div>
                                        </div>
                                    )}
                                    {booking.ledger_id && (
                                        <div>
                                            <Label>Ledger ID</Label>
                                            <div className="text-sm font-mono bg-gray-100 p-2 rounded">{booking.ledger_id}</div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Save Button */}
                        <div className="flex gap-2 justify-between mt-6 pt-4 border-t">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button className="bg-teal-800">WhatsApp</Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" className="flex flex-col gap-2">
                                    <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(1)}>
                                        Blank <SendHorizonal />
                                    </Button>
                                    <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(2)}>
                                        Registration Message
                                        <SendHorizonal />
                                    </Button>
                                    <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(3)}>
                                        Followup Message
                                        <SendHorizonal />
                                    </Button>
                                    <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(4)}>
                                        Confirmation Message
                                        <SendHorizonal />
                                    </Button>
                                    <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(5)}>
                                        RoomDetails Message
                                        <SendHorizonal />
                                    </Button>
                                      <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(6)}>
                                       Modification Message
                                        <SendHorizonal />
                                    </Button>
                                     <Button variant="outline" className="flex justify-between" onClick={() => handleWhatsApp(7)}>
                                      Cancellation Message
                                        <SendHorizonal />
                                    </Button>
                                </PopoverContent>
                            </Popover>

                            <div className="flex gap-2 items-center justify-end">
                                {onCancel && (
                                    <Button variant="outline" onClick={onCancel}>
                                        Cancel
                                    </Button>
                                )}
                                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                                    <Save className="w-4 h-4 mr-2" />
                                    {saving ? "Saving..." : "Save Booking"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Member Form Dialog */}
            {showMemberForm && (
                <MemberFormDialog
                    key={`member-form-${memberFormKey}-${editingMember ?? "new"}`}
                    isOpen={showMemberForm}
                    initialMemberData={memberForm}
                    isEditing={editingMember !== null}
                    onSave={handleSaveMember}
                    onDelete={handleDeleteMember}
                    onClose={handleCloseMemberForm}
                />
            )}

            {/* Room Assignment Dialog */}
            {showRoomDialog && assigningMemberIndex !== null && (
                <RoomAssignmentDialog
                    isOpen={showRoomDialog}
                    familyId={family.familyid}
                    member={members[assigningMemberIndex]}
                    onAssign={handleBedAssignment}
                    onClose={() => {
                        setShowRoomDialog(false);
                        setAssigningMemberIndex(null);
                    }}
                />
            )}

            {/* Room Selector Dialog */}
            <RoomSelector isOpen={showRoomSelector} selectedRoomIds={selectedRooms} onToggleRoom={handleToggleRoom} onClose={() => setShowRoomSelector(false)} />

            {/* WhatsApp Message Dialog */}
            <WhatsAppMessage
                isOpen={showWhatsAppDialog}
                onClose={() => setShowWhatsAppDialog(false)}
                familyData={family}
                members={members}
                bookingData={booking}
                roomAssignments={selectedRooms}
                initialTemplate={selectedWhatsAppTemplate}
            />
        </>
    );
};

export default BookingForm;
