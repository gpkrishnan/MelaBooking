"use client";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import fetcher from "@/db/fetcher";
import useSWR from "swr";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import WithAuth from "@/components/WithAuth";

const LodgeWiseReportContent = () => {
    const [selectedLodge, setSelectedLodge] = useState("");
    const [reportType, setReportType] = useState("for_lodge");
    const [reportData, setReportData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    // Fetch lodge names
    const { data: lodges, error: lodgesError, isLoading: lodgesLoading } = useSWR("data/lodgenames.php", (url) => fetcher(url, { method: "GET" }));

    // Function to fetch lodge data
    const fetchLodgeData = async () => {
        if (!selectedLodge) return;

        setIsLoadingReport(true);
        try {
            const formData = new FormData();
            formData.append("lodgename", selectedLodge);

            const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_API_URL + "data/lodgewise.php", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error("Error fetching lodge data:", error);
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Auto-fetch data when lodge is selected
    useEffect(() => {
        if (selectedLodge) {
            fetchLodgeData();
        } else {
            setReportData(null);
        }
    }, [selectedLodge]);

    // Export to Excel
    const exportToExcel = () => {
        if (!reportData || !reportData.rooms) return;

        const lodgeName = reportData.lodge?.split("-")[1]?.replace(/_/g, " ") || reportData.lodge || selectedLodge;

        // Prepare worksheet data
        const wsData = [];
        const merges = [];

        // Add title row
        wsData.push([lodgeName]);
        wsData.push([]); // Empty row

        let currentRow = 2; // Starting row after title and empty row

        if (reportType === "for_lodge") {
            // Add headers
            wsData.push(["Room No", "ID No.", "Name", "Age", "Phone", "Photo Id", "Check-In", "Check-Out"]);
            currentRow++;

            // Add data rows
            reportData.rooms.forEach((room) => {
                const validMembers = room.members.filter((m) => m.name);
                const memberCount = validMembers.length;

                if (memberCount > 0) {
                    const startRow = currentRow;

                    validMembers.forEach((member, idx) => {
                        wsData.push([
                            idx === 0 ? `${room.roomno}\n${room.actype}` : "",
                            member.KKID || "",
                            member.name || "",
                            `${member.sex || ""} ${member.age || ""}`,
                            member.phone || "",
                            member.photoid || "",
                            member.checkin || "",
                            member.checkout || "",
                        ]);
                        currentRow++;
                    });

                    // Add merge for room number column if multiple members
                    if (memberCount > 1) {
                        merges.push({
                            s: { r: startRow, c: 0 }, // start cell (row, column)
                            e: { r: startRow + memberCount - 1, c: 0 }, // end cell
                        });
                    }
                }
            });
        } else {
            // Full data
            wsData.push(["Room No", "ID No.", "Name", "Age", "Phone", "Photo Id", "Arrival", "Check-In", "Check-Out", "Depature", "Regn Details"]);
            currentRow++;

            reportData.rooms.forEach((room) => {
                const validMembers = room.members.filter((m) => m.name);
                const memberCount = validMembers.length;

                if (memberCount > 0) {
                    const startRow = currentRow;

                    validMembers.forEach((member, idx) => {
                        const arrival = [member.arrival || member.arr_bus_no, member.arrivaltime, member.arrivalcity].filter(Boolean).join(" ");
                        const departure = [member.depature || member.dep_bus_no, member.depaturetime, member.depaturecity].filter(Boolean).join(" ");
                        const regnDetails = `WA: ${member.whatsApp || ""} EC:${member.emergency || ""}`;

                        wsData.push([
                            idx === 0 ? `${room.roomno}\n${room.actype}` : "",
                            member.KKID || "",
                            member.name || "",
                            `${member.sex || ""} ${member.age || ""}`,
                            member.phone || "",
                            member.photoid || "",
                            arrival,
                            member.checkin || "",
                            member.checkout || "",
                            departure,
                            regnDetails,
                        ]);
                        currentRow++;
                    });

                    // Add merge for room number column if multiple members
                    if (memberCount > 1) {
                        merges.push({
                            s: { r: startRow, c: 0 },
                            e: { r: startRow + memberCount - 1, c: 0 },
                        });
                    }
                }
            });
        }

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Apply merges
        ws["!merges"] = merges;

        // Set column widths
        if (reportType === "for_lodge") {
            ws["!cols"] = [
                { wch: 12 }, // Room No
                { wch: 15 }, // ID No
                { wch: 25 }, // Name
                { wch: 10 }, // Age
                { wch: 14 }, // Phone
                { wch: 15 }, // Photo Id
                { wch: 18 }, // Check-In
                { wch: 18 }, // Check-Out
            ];
        } else {
            ws["!cols"] = [
                { wch: 12 }, // Room No
                { wch: 15 }, // ID No
                { wch: 25 }, // Name
                { wch: 10 }, // Age
                { wch: 14 }, // Phone
                { wch: 15 }, // Photo Id
                { wch: 25 }, // Arrival
                { wch: 18 }, // Check-In
                { wch: 18 }, // Check-Out
                { wch: 25 }, // Departure
                { wch: 25 }, // Regn Details
            ];
        }

        // Style the title row
        if (ws["A1"]) {
            ws["A1"].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: "center" },
            };
        }

        // Style the header row
        const headerRow = 3;
        const headerCells = reportType === "for_lodge" ? ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3"] : ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3", "J3", "K3"];

        headerCells.forEach((cell) => {
            if (ws[cell]) {
                ws[cell].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "D3D3D3" } },
                    alignment: { horizontal: "center", vertical: "center" },
                };
            }
        });

        // Create workbook and add worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Lodge Report");

        // Save file
        XLSX.writeFile(wb, `${lodgeName.replace(/[^a-z0-9]/gi, "_")}_${reportType}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        if (!reportData || !reportData.rooms) return;

        const doc = new jsPDF("p", "mm", "a4");
        const lodgeName = reportData.lodge?.split("-")[1]?.replace(/_/g, " ") || reportData.lodge;

        // Add title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(lodgeName, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

        let tableData = [];
        let tableHeaders = [];
        let rowSpanInfo = []; // Track which rows should be merged

        if (reportType === "for_lodge") {
            // Minimal info table
            tableHeaders = [
                { header: "Room No", dataKey: "roomno" },
                { header: "ID No.", dataKey: "kkid" },
                { header: "Name", dataKey: "name" },
                { header: "Age", dataKey: "age" },
                { header: "Phone", dataKey: "phone" },
                { header: "Photo Id", dataKey: "photoid" },
                { header: "Check-In", dataKey: "checkin" },
                { header: "Check-Out", dataKey: "checkout" },
            ];

            reportData.rooms.forEach((room) => {
                const validMembers = room.members.filter((m) => m.name);
                const memberCount = validMembers.length;
                let memberIdx = 0;

                validMembers.forEach((member, idx) => {
                    tableData.push({
                        roomno: idx === 0 ? `${room.roomno}\n${room.actype}` : "",
                        kkid: member.KKID || "",
                        name: member.name || "",
                        age: `${member.sex || ""} ${member.age || ""}`,
                        phone: member.phone || "",
                        photoid: member.photoid || "",
                        checkin: member.checkin || "",
                        checkout: member.checkout || "",
                    });

                    rowSpanInfo.push({
                        isFirstInGroup: idx === 0,
                        memberCount: memberCount,
                        memberIndex: idx,
                    });
                });
            });
        } else {
            // Full data table
            tableHeaders = [
                { header: "Room No", dataKey: "roomno" },
                { header: "ID No.", dataKey: "kkid" },
                { header: "Name", dataKey: "name" },
                { header: "Age", dataKey: "age" },
                { header: "Phone", dataKey: "phone" },
                { header: "Photo Id", dataKey: "photoid" },
                { header: "Arrival", dataKey: "arrival" },
                { header: "Check-In", dataKey: "checkin" },
                { header: "Check-Out", dataKey: "checkout" },
                { header: "Depature", dataKey: "departure" },
                { header: "Regn Details", dataKey: "regndetails" },
            ];

            reportData.rooms.forEach((room) => {
                const validMembers = room.members.filter((m) => m.name);
                const memberCount = validMembers.length;

                validMembers.forEach((member, idx) => {
                    const arrival = [member.arrival || member.arr_bus_no, member.arrivaltime, member.arrivalcity].filter(Boolean).join(" ");
                    const departure = [member.depature || member.dep_bus_no, member.depaturetime, member.depaturecity].filter(Boolean).join(" ");
                    const regnDetails = `WA:${member.whatsApp || ""} EC:${member.emergency || ""}`;

                    tableData.push({
                        roomno: idx === 0 ? `${room.roomno}\n${room.actype}` : "",
                        kkid: member.KKID || "",
                        name: member.name || "",
                        age: `${member.sex || ""} ${member.age || ""}`,
                        phone: member.phone || "",
                        photoid: member.photoid || "",
                        arrival: arrival,
                        checkin: member.checkin || "",
                        checkout: member.checkout || "",
                        departure: departure,
                        regndetails: regnDetails,
                    });

                    rowSpanInfo.push({
                        isFirstInGroup: idx === 0,
                        memberCount: memberCount,
                        memberIndex: idx,
                    });
                });
            });
        }

        autoTable(doc, {
            startY: 25,
            head: [tableHeaders.map((h) => h.header)],
            body: tableData.map((row) => tableHeaders.map((h) => row[h.dataKey])),
            theme: "grid",
            headStyles: {
                fillColor: [169, 169, 169],
                textColor: [0, 0, 0],
                fontStyle: "bold",
                halign: "center",
                fontSize: reportType === "for_lodge" ? 8 : 7,
            },
            bodyStyles: {
                fontSize: reportType === "for_lodge" ? 7 : 6,
                cellPadding: 2,
                overflow: "linebreak",
                cellWidth: "wrap",
            },
            columnStyles:
                reportType === "for_lodge"
                    ? {
                          0: { cellWidth: 18, halign: "center", valign: "middle", overflow: "linebreak" }, // Room No
                          1: { cellWidth: 26, overflow: "linebreak" }, // ID No
                          2: { cellWidth: 40, overflow: "linebreak" }, // Name
                          3: { cellWidth: 14, halign: "center", overflow: "linebreak" }, // Age
                          4: { cellWidth: 22, overflow: "linebreak" }, // Phone
                          5: { cellWidth: 26, overflow: "linebreak" }, // Photo Id
                          6: { cellWidth: 24, fontSize: 6, overflow: "linebreak" }, // Check-In
                          7: { cellWidth: 24, fontSize: 6, overflow: "linebreak" }, // Check-Out
                      }
                    : {
                          0: { cellWidth: 14, halign: "center", valign: "middle", fontSize: 6, overflow: "linebreak" }, // Room No
                          1: { cellWidth: 18, fontSize: 5, overflow: "linebreak" }, // ID No
                          2: { cellWidth: 26, fontSize: 6, overflow: "linebreak" }, // Name
                          3: { cellWidth: 11, halign: "center", fontSize: 6, overflow: "linebreak" }, // Age
                          4: { cellWidth: 17, fontSize: 5, overflow: "linebreak" }, // Phone
                          5: { cellWidth: 18, fontSize: 5, overflow: "linebreak" }, // Photo Id
                          6: { cellWidth: 23, fontSize: 5, overflow: "linebreak" }, // Arrival
                          7: { cellWidth: 17, fontSize: 5, overflow: "linebreak" }, // Check-In
                          8: { cellWidth: 17, fontSize: 5, overflow: "linebreak" }, // Check-Out
                          9: { cellWidth: 23, fontSize: 5, overflow: "linebreak" }, // Departure
                          10: { cellWidth: 26, fontSize: 5, overflow: "linebreak" }, // Regn Details
                      },
            margin: { top: 25, right: 10, bottom: 10, left: 10 },
            didDrawCell: (data) => {
                // Remove top/bottom borders for room number cells in the same group
                if (data.section === "body" && data.column.index === 0) {
                    const rowInfo = rowSpanInfo[data.row.index];

                    if (rowInfo) {
                        const isFirst = rowInfo.isFirstInGroup;
                        const isLast = rowInfo.memberIndex === rowInfo.memberCount - 1;
                        const hasMerge = rowInfo.memberCount > 1;

                        if (hasMerge) {
                            // Add gray background to first cell
                            if (isFirst) {
                                doc.setFillColor(240, 240, 240);
                                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
                            }

                            // Set styling for room number cells
                            doc.setFontSize(reportType === "for_lodge" ? 7 : 6);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(0, 0, 0);

                            // Redraw text for first cell (since we filled background)
                            if (isFirst && data.cell.text && data.cell.text.length > 0) {
                                const lines = data.cell.text;
                                const lineHeight = 3.5;
                                const startY = data.cell.y + data.cell.padding("top") + lineHeight;

                                lines.forEach((line, i) => {
                                    doc.text(line, data.cell.x + data.cell.width / 2, startY + i * lineHeight, {
                                        align: "center",
                                    });
                                });
                            }

                            // Draw left border (always)
                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.1);
                            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);

                            // Draw right border (always)
                            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);

                            // Draw top border (only for first in group)
                            if (isFirst) {
                                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                            } else {
                                // Cover the top border completely with white
                                doc.setDrawColor(255, 255, 255);
                                doc.setLineWidth(0.3);
                                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                                doc.setDrawColor(200, 200, 200);
                                doc.setLineWidth(0.1);
                            }

                            // Draw bottom border (only for last in group)
                            if (isLast) {
                                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                            } else {
                                // Cover the bottom border completely with white
                                doc.setDrawColor(255, 255, 255);
                                doc.setLineWidth(0.3);
                                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                                doc.setDrawColor(200, 200, 200);
                                doc.setLineWidth(0.1);
                            }
                        }
                    }
                }
            },
        });

        doc.save(`${lodgeName.replace(/[^a-z0-9]/gi, "_")}_${reportType}.pdf`);
    };

    if (lodgesLoading) {
        return <div className="m-2 p-2">Loading lodges...</div>;
    }

    if (lodgesError) {
        return <div className="m-2 p-2 text-red-500">Error loading lodges</div>;
    }

    return (
        <div className={`mx-auto p-4 ${reportType == "for_lodge" ? "max-w-[1200px]" : "max-w-[1800px]"}`}>
            <div className="flex gap-4 items-end mb-4">
                <div className="flex-1">
                    <label className="block mb-2 font-semibold">Lodge Name</label>
                    <Select value={selectedLodge} onValueChange={setSelectedLodge}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Lodge" />
                        </SelectTrigger>
                        <SelectContent>
                            {lodges?.map((lodge) => (
                                <SelectItem key={lodge} value={lodge}>
                                    {lodge.split("-")[1]?.replace(/_/g, " ") || lodge}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1">
                    <label className="block mb-2 font-semibold">Type</label>
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="for_lodge">For Lodge</SelectItem>
                            <SelectItem value="full_data">Full Data</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {reportData && (
                    <div className="flex gap-2">
                        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
                            Export Excel
                        </Button>
                        <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white">
                            Export PDF
                        </Button>
                    </div>
                )}
            </div>

            {isLoadingReport && <div className="text-center py-4">Loading report...</div>}

            {reportData && reportData.rooms && (
                <div>
                    <h2 className="text-xl font-bold mb-4 bg-gray-400 p-2 text-center">{reportData.lodge?.split("-")[1]?.replace(/_/g, " ") || reportData.lodge}</h2>

                    {reportType === "for_lodge" ? (
                        <Table className="border table-fixed w-full">
                            <colgroup>
                                <col style={{ width: "9%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "20%" }} />
                                <col style={{ width: "7%" }} />
                                <col style={{ width: "11%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "13%" }} />
                                <col style={{ width: "14%" }} />
                            </colgroup>
                            <TableHeader className="bg-gray-300">
                                <TableRow>
                                    <TableHead className="border text-center text-xs p-2">Room No</TableHead>
                                    <TableHead className="border text-center text-xs p-2">ID No.</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Name</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Age</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Phone</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Photo Id</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Check-In</TableHead>
                                    <TableHead className="border text-center text-xs p-2">Check-Out</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.rooms.map((room, roomIdx) =>
                                    room.members.map((member, memberIdx) => {
                                        if (!member.name) return null;
                                        return (
                                            <TableRow key={`${roomIdx}-${memberIdx}`}>
                                                {memberIdx === 0 ? (
                                                    <TableCell className="border text-center font-semibold bg-gray-100 text-xs p-2 break-word" rowSpan={room.members.filter((m) => m.name).length}>
                                                        {room.roomno}
                                                        <br />
                                                        {room.actype}
                                                    </TableCell>
                                                ) : null}
                                                <TableCell className="border text-xs p-2 break-word">{member.KKID || ""}</TableCell>
                                                <TableCell className="border text-xs p-2 break-word">{member.name || ""}</TableCell>
                                                <TableCell className="border text-center text-xs p-2 break-word">
                                                    {member.sex || ""} {member.age || ""}
                                                </TableCell>
                                                <TableCell className="border text-xs p-2 break-word">{member.phone || ""}</TableCell>
                                                <TableCell className="border text-xs p-2 break-word">{member.photoid || ""}</TableCell>
                                                <TableCell className="border text-center text-[10px] p-2 break-word">{member.checkin || ""}</TableCell>
                                                <TableCell className="border text-center text-[10px] p-2 break-word">{member.checkout || ""}</TableCell>
                                            </TableRow>
                                        );
                                    }),
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="border table-fixed min-w-full">
                                <colgroup>
                                    <col style={{ width: "80px" }} />
                                    <col style={{ width: "120px" }} />
                                    <col style={{ width: "180px" }} />
                                    <col style={{ width: "70px" }} />
                                    <col style={{ width: "110px" }} />
                                    <col style={{ width: "120px" }} />
                                    <col style={{ width: "200px" }} />
                                    <col style={{ width: "140px" }} />
                                    <col style={{ width: "140px" }} />
                                    <col style={{ width: "200px" }} />
                                    <col style={{ width: "180px" }} />
                                </colgroup>
                                <TableHeader className="bg-gray-300">
                                    <TableRow>
                                        <TableHead className="border text-center text-[10px] p-1">Room No</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">ID No.</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Name</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Age</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Phone</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Photo Id</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Arrival</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Check-In</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Check-Out</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Depature</TableHead>
                                        <TableHead className="border text-center text-[10px] p-1">Regn Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.rooms.map((room, roomIdx) =>
                                        room.members.map((member, memberIdx) => {
                                            if (!member.name) return null;

                                            const arrivalInfo = [member.arrival || member.arr_bus_no, member.arrivaltime, member.arrivalcity].filter(Boolean).join(" ");

                                            const departureInfo = [member.depature || member.dep_bus_no, member.depaturetime, member.depaturecity].filter(Boolean).join(" ");

                                            const regnDetails = `WA: ${member.whatsApp || ""} EC:${member.emergency || ""}`;

                                            return (
                                                <TableRow key={`${roomIdx}-${memberIdx}`}>
                                                    {memberIdx === 0 ? (
                                                        <TableCell className="border text-center font-semibold bg-gray-100 text-[10px] p-1 truncate" rowSpan={room.members.filter((m) => m.name).length}>
                                                            {room.roomno}
                                                            <br />
                                                            {room.actype}
                                                        </TableCell>
                                                    ) : (
                                                        <TableCell></TableCell>
                                                    )}
                                                    <TableCell className="border text-[10px] p-1 truncate">{member.KKID || ""}</TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{member.name || ""}</TableCell>
                                                    <TableCell className="border text-center text-[10px] p-1 truncate">
                                                        {member.sex || ""} {member.age || ""}
                                                    </TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{member.phone || ""}</TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{member.photoid || ""}</TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{arrivalInfo}</TableCell>
                                                    <TableCell className="border text-[10px] text-center p-1 truncate">{member.checkin || ""}</TableCell>
                                                    <TableCell className="border text-[10px] text-center p-1 truncate">{member.checkout || ""}</TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{departureInfo}</TableCell>
                                                    <TableCell className="border text-[10px] p-1 truncate">{regnDetails}</TableCell>
                                                </TableRow>
                                            );
                                        }),
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {!reportData && !isLoadingReport && <div className="text-center py-8 text-gray-500">Select a lodge to view the report</div>}
        </div>
    );
};

const LodgeWiseReport = () => {
    return (
        <WithAuth>
            <LodgeWiseReportContent />
        </WithAuth>
    );
};

export default LodgeWiseReport;
