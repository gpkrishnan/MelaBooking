"use client";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import fetcher from "@/db/fetcher";
import useSWR from "swr";
import WithAuth from "@/components/WithAuth";
import { Fragment, useState, useEffect } from "react";
import { formatHotelName } from "@/lib/formatHotelName";

const DashBoardContent = () => {
    const { data, error, isLoading } = useSWR("data/dashboard.php", (url) => fetcher(url, { method: "GET" }));
    const [ACT, setACT] = useState(0);
    const [NACT, setNACT] = useState(0);
    const [DORT, setDORT] = useState(0);

    useEffect(() => {
        if (data && data[0]) {
            let actTotal = 0,
                nactTotal = 0,
                dortTotal = 0;
            data[0].forEach((lodge,idx) => {
                if (idx<data[0].length-1){
                actTotal += Math.floor(lodge.AC||0) + Math.floor(lodge.ACR||0) + Math.floor(lodge.ACB||0) + Math.floor(lodge.ACA);
                nactTotal += Math.floor(lodge.NAC||0) + Math.floor(lodge.NACR||0) + Math.floor(lodge.NACB||0) + Math.floor(lodge.NACA);
                dortTotal += Math.floor(lodge.DOR||0) + Math.floor(lodge.DORR||0) + Math.floor(lodge.DORB||0) + Math.floor(lodge.DORA);
                }
            });
            setACT(actTotal);
            setNACT(nactTotal);
            setDORT(dortTotal);
        }
    }, [data]);

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

    return (
        <div className="m-2 mx-auto max-w-[1200px] p-2 border rounded">
            <Table>
                <TableHeader className=" bg-lime-100">
                    <TableRow className="font-bold">
                        <TableHead rowSpan={2} className="text-center border">
                            #
                        </TableHead>
                        <TableHead rowSpan={2} className="text-center border">
                            Lodge
                        </TableHead>
                        <TableHead colSpan={5} className="text-center border">
                            AC Beds
                        </TableHead>
                        <TableHead colSpan={5} className="text-center border">
                            Non-AC Beds
                        </TableHead>
                        <TableHead colSpan={5} className="text-center border">
                            Dormitory
                        </TableHead>
                    </TableRow>
                    <TableRow>
                        <TableHead className="text-center border">Registered</TableHead>
                        <TableHead className="text-center border">Booked</TableHead>
                        <TableHead className="text-center border">Blocked</TableHead>
                        <TableHead className="text-center border">Available</TableHead>
                        <TableHead className="text-center border">Total</TableHead>
                        <TableHead className="text-center border">Registered</TableHead>
                        <TableHead className="text-center border">Booked</TableHead>
                        <TableHead className="text-center border">Blocked</TableHead>
                        <TableHead className="text-center border">Available</TableHead>
                        <TableHead className="text-center border">Total</TableHead>
                        <TableHead className="text-center border">Registered</TableHead>
                        <TableHead className="text-center border">Booked</TableHead>
                        <TableHead className="text-center border">Blocked</TableHead>
                        <TableHead className="text-center border">Available</TableHead>
                        <TableHead className="text-center border">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="border rounded-b">
                    {data[0].map((lodge, lidx) => {
                        return (
                            <Fragment key={lidx}>
                                {lidx == data[0].length - 1 && (
                                    <TableRow className="bg-gray-200">
                                        <TableCell colSpan={6}></TableCell>
                                        <TableCell className=" border text-right">{ACT}</TableCell>
                                        <TableCell colSpan={4}></TableCell>
                                        <TableCell className=" border text-right">{NACT}</TableCell>
                                        <TableCell colSpan={4}></TableCell>
                                        <TableCell className=" border text-right">{DORT}</TableCell>
                                    </TableRow>
                                )}
                                <TableRow className="">
                                    <TableCell className=" border ">{lidx + 1}</TableCell>
                                    <TableCell className=" border ">{formatHotelName(lodge.lodge)}</TableCell>
                                    <TableCell className=" border text-right">{lodge.ACR || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.ACB || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.ACA || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.AC || ""}</TableCell>
                                    <TableCell className=" border text-right">{Math.floor(lodge.ACR + lodge.ACB + lodge.ACA + lodge.AC) || ""}</TableCell>

                                    <TableCell className=" border text-right">{lodge.NACR || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.NACB || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.NACA || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.NAC || ""}</TableCell>
                                    <TableCell className=" border text-right">{Math.floor(lodge.NACR + lodge.NACB + lodge.NACA + lodge.NAC) || ""}</TableCell>

                                    <TableCell className=" border text-right">{lodge.DORR || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.DORB || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.DORA || ""}</TableCell>
                                    <TableCell className=" border text-right">{lodge.DOR || ""}</TableCell>
                                    <TableCell className=" border text-right">{Math.floor(lodge.DORR + lodge.DORB + lodge.DORA + lodge.DOR) || ""}</TableCell>
                                </TableRow>
                            </Fragment>
                        );
                    })}
                    <TableRow className="bg-gray-200">
                        <TableCell colSpan={17}></TableCell>
                    </TableRow>
                    {data[1] && (
                        <>
                            <TableRow className="">
                                <TableCell colSpan={2} rowSpan={3} className=" border ">
                                    Total
                                </TableCell>
                                <TableCell className=" border text-right">{data[1].A?.R || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].A?.B || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].A?.A || ""}</TableCell>
                                <TableCell className=" border text-right bg-pink-200/30">{Math.floor(ACT - ((data[1].A?.R || 0) + (data[1].A?.B || 0) + (data[1].A?.A || 0)))}</TableCell>
                                <TableCell className=" border text-right"></TableCell>

                                <TableCell className=" border text-right">{data[1].N?.R || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].N?.B || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].N?.A || ""}</TableCell>
                                <TableCell className=" border text-right bg-pink-200/30">{Math.floor(NACT - ((data[1].N?.R || 0) + (data[1].N?.B || 0) + (data[1].N?.A || 0))) || ""}</TableCell>
                                <TableCell className=" border text-right"></TableCell>

                                <TableCell className=" border text-right">{data[1].D?.R || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].D?.B || ""}</TableCell>
                                <TableCell className=" border text-right">{data[1].D?.A || ""}</TableCell>
                                <TableCell className=" border text-righ bg-pink-200/30">{Math.floor(DORT - ((data[1].D?.R || 0) + (data[1].D?.B || 0) + (data[1].D?.A || 0))) || ""}</TableCell>
                                <TableCell className=" border text-right"></TableCell>
                            </TableRow>

                            <TableRow className="">
                                <TableCell colSpan={5} className="text-center border font-bold">
                                    {Math.floor(data[1].A?.R || 0) + Math.floor(data[1].A?.B || 0) + Math.floor(data[1].A?.A || 0)}
                                </TableCell>
                                <TableCell colSpan={5} className="text-center border font-bold">
                                    {Math.floor(data[1].N?.R || 0) + Math.floor(data[1].N?.B || 0) + Math.floor(data[1].N?.A || 0)}
                                </TableCell>
                                <TableCell colSpan={5} className="text-center border font-bold">
                                    {Math.floor(data[1].D?.R || 0) + Math.floor(data[1].D?.B || 0) + Math.floor(data[1].D?.A || 0)}
                                </TableCell>
                            </TableRow>
                            <TableRow className="">
                                <TableCell colSpan={17} className="text-center border font-bold">
                                    {Math.floor(data[1].A?.R || 0) +
                                        Math.floor(data[1].A?.B || 0) +
                                        Math.floor(data[1].A?.A || 0) +
                                        Math.floor(data[1].N?.R || 0) +
                                        Math.floor(data[1].N?.B || 0) +
                                        Math.floor(data[1].N?.A || 0) +
                                        Math.floor(data[1].D?.R || 0) +
                                        Math.floor(data[1].D?.B || 0) +
                                        Math.floor(data[1].D?.A || 0)}
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-200">
                                <TableCell colSpan={15}></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="border text-center" colSpan={2}>
                                    Amount:
                                </TableCell>
                                <TableCell className="border text-center" colSpan={5}>
                                    Received: ₹{data[2].booked.toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell className="border text-center" colSpan={5}>
                                    Pending: ₹{data[2].reserved.toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell className="border text-center" colSpan={4}>
                                    Total: ₹{(data[2].reserved + data[2].booked).toLocaleString("en-IN")}
                                </TableCell>
                            </TableRow>
                            <TableRow className="bg-gray-200">
                                <TableCell colSpan={14}></TableCell>
                            </TableRow>
                        </>
                    )}
                </TableBody>
            </Table>
            <Table className="mt-2">
                <TableHeader className=" bg-blue-200">
                    <TableRow className="font-bold">
                        <TableHead className="text-center border">#</TableHead>
                        <TableHead className="text-center border">Room Type</TableHead>
                        <TableHead className="text-center border">No of Bookings</TableHead>
                        <TableHead className="text-center border">No of Rooms</TableHead>
                        <TableHead className="text-center border">Members</TableHead>
                        <TableHead className="text-center border">Bill Amount</TableHead>
                        <TableHead className="text-center border">Recd Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data[3] &&
                        data[3].map((d, i) => {
                            return (
                                <TableRow className="" key={`3x${i}`}>
                                    <TableCell className="text-left border">{i + 1}</TableCell>
                                    <TableCell className="text-right border">{d.room_category}</TableCell>
                                    <TableCell className="text-right border">{d.fmlycnt}</TableCell>
                                    <TableCell className="text-right border">{d.roomcnt}</TableCell>
                                    <TableCell className="text-right border">{d.paxcnt}</TableCell>
                                    <TableCell className="text-right border">₹{d.ba?.toLocaleString("en-IN")}</TableCell>
                                    <TableCell className="text-right border">₹{d.ra?.toLocaleString("en-IN")}</TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>

            <Table className="mt-2">
                <TableHeader className="bg-teal-100">
                    <TableRow className="font-bold">
                        <TableHead colSpan={7} className="text-center border">
                            ADMIN - BLOCKED
                        </TableHead>
                    </TableRow>
                    <TableRow className="font-bold">
                        <TableHead className="text-center border">#</TableHead>
                        <TableHead className="text-center border">Room Type</TableHead>
                        <TableHead className="text-center border">No of Bookings</TableHead>
                        <TableHead className="text-center border">No of Rooms</TableHead>
                        <TableHead className="text-center border">Members</TableHead>
                        <TableHead className="text-center border">Bill Amount</TableHead>
                        <TableHead className="text-center border">Recd Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data[4] &&
                        data[4].map((d, i) => {
                            return (
                                <TableRow className="" key={`4x${i}`}>
                                    <TableCell className="text-left border">{i + 1}</TableCell>
                                    <TableCell className="text-right border">{d.room_category}</TableCell>
                                    <TableCell className="text-right border">{d.fmlycnt}</TableCell>
                                    <TableCell className="text-right border">{d.roomcnt}</TableCell>
                                    <TableCell className="text-right border">{d.paxcnt}</TableCell>
                                    <TableCell className="text-right border">{d.ba}</TableCell>
                                    <TableCell className="text-right border">{d.ra}</TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
            </Table>

            <Table className="mt-2">
                <TableHeader className="bg-purple-100">
                    <TableRow className="font-bold">
                        <TableHead colSpan={5} className="text-center border">
                            SINGLE PERSONS SHARING A ROOM
                        </TableHead>
                    </TableRow>
                    <TableRow className="font-bold">
                        <TableHead className="text-center border">Combine No</TableHead>
                        <TableHead className="text-center border">Room Type</TableHead>
                        <TableHead className="text-center border">Bookings</TableHead>
                        <TableHead className="text-center border">Persons</TableHead>
                        <TableHead className="text-center border">Rooms</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data[5] && data[5].length > 0 ? (
                        data[5].map((d, i) => (
                            <TableRow key={`5x${i}`}>
                                <TableCell className="text-center border">{d.combine_no}</TableCell>
                                <TableCell className="text-center border">{d.room_category}</TableCell>
                                <TableCell className="text-left border">
                                    {d.members.map((m) => (
                                        <div key={m.id}>
                                            PAN-2027-{m.id} {m.name}
                                        </div>
                                    ))}
                                </TableCell>
                                <TableCell className="text-right border">{d.members.length}</TableCell>
                                <TableCell className="text-right border">1</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center border text-muted-foreground">
                                None
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

const DashBoard = () => {
    return (
        <WithAuth>
            <DashBoardContent />
        </WithAuth>
    );
};

export default DashBoard;
