"use client";

import DevoteeSuggest from "@/components/DevoteeSuggest";
import AadhaarImage from "@/components/AadhaarImage";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Save, X, Trash2 } from "lucide-react";

const MemberFormDialog = ({ isOpen, initialMemberData, isEditing, onSave, onDelete, onClose }) => {
    // Helper functions for date formatting
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

    // Local state for form data - will be populated from initialMemberData
    const [formData, setFormData] = useState({
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

    // Update local state when initialMemberData changes
    useEffect(() => {
        if (initialMemberData) {
            setFormData(initialMemberData);
        }
    }, [initialMemberData]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
        }
    };
    const handleOverlayClick = (e) => {
        // Only close if clicking the overlay itself, not its children
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: 9999, pointerEvents: "auto" }} onClick={handleOverlayClick}>
            <div className="bg-white rounded-lg shadow-xl max-w-[80vw] max-h-[90vh] min-w-[80vw] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b pb-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {isEditing ? "Edit Member" : "Add Member"}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 py-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="membername">Name *</Label>
                            <Input id="membername" value={formData.name || ""} onChange={(e) => handleChange("name", e.target.value)} placeholder="Member Name" autoComplete="off" />
                        </div>
                        <div>
                            <Label htmlFor="memberphotoid">Photo ID / Aadhaar No.</Label>
                            <Input id="memberphotoid" value={formData.photoidno || ""} onChange={(e) => handleChange("photoidno", e.target.value)} placeholder="Aadhaar / Passport / other photo ID" autoComplete="off" />
                            <DevoteeSuggest
                                by="aadhaar"
                                value={formData.photoidno}
                                onPick={(p) => {
                                    if (!formData.name && p.name) handleChange("name", p.name);
                                    if (!formData.age && p.age) handleChange("age", String(p.age));
                                    if (!formData.phone && p.phone) handleChange("phone", p.phone);
                                    if (p.sex) handleChange("sex", p.sex);
                                }}
                            />
                            <div className="mt-1">
                                <AadhaarImage aadhaar={formData.photoidno} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="memberphone">Phone</Label>
                            <Input id="memberphone" value={formData.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} placeholder="Phone Number" autoComplete="off" />
                        </div>
                        <div>
                            <Label htmlFor="memberage">Age</Label>
                            <Input id="memberage" type="number" value={formData.age || ""} onChange={(e) => handleChange("age", e.target.value)} placeholder="Age" autoComplete="off" />
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="membersex">Sex</Label>
                            <Select value={formData.sex} onValueChange={(value) => handleChange("sex", value)}>
                                <SelectTrigger id="membersex">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 10000 }}>
                                    <SelectItem value="M">Male</SelectItem>
                                    <SelectItem value="F">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="memberroom">Room Type</Label>
                            <Select value={formData.p_roomtype} onValueChange={(value) => handleChange("p_roomtype", value)}>
                                <SelectTrigger id="memberroom">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 10000 }}>
                                    <SelectItem value="N">Non-AC</SelectItem>
                                    <SelectItem value="A">AC</SelectItem>
                                    <SelectItem value="D">Dormitory</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="membertoilet">Toilet</Label>
                            <Select value={formData.p_toilet} onValueChange={(value) => handleChange("p_toilet", value)}>
                                <SelectTrigger id="membertoilet">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 10000 }}>
                                    <SelectItem value="N">Any</SelectItem>
                                    <SelectItem value="0">Indian</SelectItem>
                                    <SelectItem value="1">Western</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="membercot">Cot</Label>
                            <Select value={formData.p_cot} onValueChange={(value) => handleChange("p_cot", value)}>
                                <SelectTrigger id="membercot">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ zIndex: 10000 }}>
                                    <SelectItem value="N">Any</SelectItem>
                                    <SelectItem value="R">Required</SelectItem>
                                    <SelectItem value="E">Extra Bed Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Arrival & Departure */}
                    <Tabs defaultValue="arrival" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="arrival">Arrival</TabsTrigger>
                            <TabsTrigger value="departure">Departure</TabsTrigger>
                        </TabsList>

                        {/* Arrival */}
                        <TabsContent value="arrival" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="arrmode">Arrive By</Label>
                                    <Select value={formData.arr_mode} onValueChange={(value) => handleChange("arr_mode", value)}>
                                        <SelectTrigger id="arrmode">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 10000 }}>
                                            <SelectItem value="T">Train</SelectItem>
                                            <SelectItem value="O">Others</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="arrtrain">Train Number</Label>
                                    <Input id="arrtrain" value={formData.arr_train_no || ""} onChange={(e) => handleChange("arr_train_no", e.target.value)} placeholder="Train Number" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="arrtime">Arrival Time</Label>
                                    <Input id="arrtime" type="datetime-local" value={formatToDateTimeLocal(formData.arr_time)} onChange={(e) => handleChange("arr_time", formatFromDateTimeLocal(e.target.value))} className="text-sm" />
                                </div>
                                <div>
                                    <Label htmlFor="arrstn">Station</Label>
                                    <Input id="arrstn" value={formData.arr_city || ""} onChange={(e) => handleChange("arr_city", e.target.value)} placeholder="Station" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="arrseat">Seat Number</Label>
                                    <Input id="arrseat" value={formData.arr_seat_no || ""} onChange={(e) => handleChange("arr_seat_no", e.target.value)} placeholder="Coach_Seat" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="arrpickup">Pickup Required</Label>
                                    <Select value={formData.pickup_bus.toString()} onValueChange={(value) => handleChange("pickup_bus", parseInt(value))}>
                                        <SelectTrigger id="arrpickup">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 10000 }}>
                                            <SelectItem value="1">Yes</SelectItem>
                                            <SelectItem value="0">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="arrcheckin">Check-in Time</Label>
                                    <Input
                                        id="arrcheckin"
                                        type="datetime-local"
                                        value={formatToDateTimeLocal(formData.checkin_time)}
                                        onChange={(e) => handleChange("checkin_time", formatFromDateTimeLocal(e.target.value))}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Departure */}
                        <TabsContent value="departure" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="depmode">Depart By</Label>
                                    <Select value={formData.dep_mode} onValueChange={(value) => handleChange("dep_mode", value)}>
                                        <SelectTrigger id="depmode">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 10000 }}>
                                            <SelectItem value="T">Train</SelectItem>
                                            <SelectItem value="O">Others</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="deptrain">Train Number</Label>
                                    <Input id="deptrain" value={formData.dep_train_no || ""} onChange={(e) => handleChange("dep_train_no", e.target.value)} placeholder="Train Number" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="deptime">Departure Time</Label>
                                    <Input id="deptime" type="datetime-local" value={formatToDateTimeLocal(formData.dep_time)} onChange={(e) => handleChange("dep_time", formatFromDateTimeLocal(e.target.value))} className="text-sm" />
                                </div>
                                <div>
                                    <Label htmlFor="depstn">Station</Label>
                                    <Input id="depstn" value={formData.dep_city || ""} onChange={(e) => handleChange("dep_city", e.target.value)} placeholder="Station" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="depseat">Seat Number</Label>
                                    <Input id="depseat" value={formData.dep_seat_no || ""} onChange={(e) => handleChange("dep_seat_no", e.target.value)} placeholder="Coach_Seat" autoComplete="off" />
                                </div>
                                <div>
                                    <Label htmlFor="depdrop">Drop Required</Label>
                                    <Select value={formData.drop_bus.toString()} onValueChange={(value) => handleChange("drop_bus", parseInt(value))}>
                                        <SelectTrigger id="depdrop">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent style={{ zIndex: 10000 }}>
                                            <SelectItem value="1">Yes</SelectItem>
                                            <SelectItem value="0">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="depcheckout">Check-out Time</Label>
                                    <Input
                                        id="depcheckout"
                                        type="datetime-local"
                                        value={formatToDateTimeLocal(formData.checkout_time)}
                                        onChange={(e) => handleChange("checkout_time", formatFromDateTimeLocal(e.target.value))}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end pt-4 border-t mt-4">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onClose();
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                        {isEditing && (
                            <Button
                                variant="destructive"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        )}
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSave();
                            }}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Member
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberFormDialog;
