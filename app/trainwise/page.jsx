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

const TrainWiseReportContent = () => {
    const [journeyType, setJourneyType] = useState("arrival");
    const [selectedTrain, setSelectedTrain] = useState("");
    const [reportData, setReportData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);

    // Fetch train numbers based on journey type
    const { data: trains, error: trainsError, isLoading: trainsLoading } = useSWR(
        journeyType ? `data/trainnos.php?mode=${journeyType}` : null,
        (url) => fetcher(url, { method: "GET" })
    );

    // Reset selected train when journey type changes
    useEffect(() => {
        setSelectedTrain("");
        setReportData(null);
    }, [journeyType]);

    // Function to fetch train data
    const fetchTrainData = async () => {
        if (!selectedTrain || !journeyType) return;

        setIsLoadingReport(true);
        try {
            const formData = new FormData();
            formData.append("trainno", selectedTrain);
            formData.append("mode", journeyType);

            const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_API_URL + "data/trainwise.php", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error("Error fetching train data:", error);
        } finally {
            setIsLoadingReport(false);
        }
    };

    // Auto-fetch data when train is selected
    useEffect(() => {
        if (selectedTrain) {
            fetchTrainData();
        } else {
            setReportData(null);
        }
    }, [selectedTrain]);

    // Export to Excel
    const exportToExcel = () => {
        if (!reportData || !reportData.lodge) return;

        const trainNo = selectedTrain === "0" ? "Not Specified" : selectedTrain;
        const journeyLabel = journeyType === "arrival" ? "Arrival" : "Departure";

        // Prepare worksheet data
        const wsData = [];
        const merges = [];

        // Add title row
        wsData.push([`Train ${trainNo} - ${journeyLabel}`]);
        wsData.push([]); // Empty row

        let currentRow = 2;

        // Add headers
        wsData.push(["Lodge", "Room No", "Type", "Seat No", "ID No.", "Name", "Age", "Phone", "Photo Id"]);
        currentRow++;

        // Add data rows
        reportData.lodge.forEach((lodge) => {
            const validMembers = lodge.members || [];
            const memberCount = validMembers.length;

            if (memberCount > 0) {
                const startRow = currentRow;

                validMembers.forEach((member, idx) => {
                    wsData.push([
                        idx === 0 ? lodge.lodgename?.split("-")[1]?.replace(/_/g, " ") || lodge.lodgename : "",
                        member.roomno || "",
                        member.type || "",
                        member.seat_no || "",
                        member.KKID || "",
                        member.name || "",
                        `${member.sex || ""} ${member.age || ""}`,
                        member.phone || "",
                        member.photoid || "",
                    ]);
                    currentRow++;
                });

                // Add merge for lodge name column if multiple members
                if (memberCount > 1) {
                    merges.push({
                        s: { r: startRow, c: 0 },
                        e: { r: startRow + memberCount - 1, c: 0 },
                    });
                }
            }
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Apply merges
        ws["!merges"] = merges;

        // Set column widths
        ws["!cols"] = [
            { wch: 25 }, // Lodge
            { wch: 12 }, // Room No
            { wch: 8 },  // Type
            { wch: 10 }, // Seat No
            { wch: 15 }, // ID No
            { wch: 25 }, // Name
            { wch: 10 }, // Age
            { wch: 14 }, // Phone
            { wch: 15 }, // Photo Id
        ];

        // Style the title row
        if (ws["A1"]) {
            ws["A1"].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: "center" },
            };
        }

        // Style the header row
        const headerCells = ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"];
        headerCells.forEach(cell => {
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
        XLSX.utils.book_append_sheet(wb, ws, "Train Report");

        // Save file
        XLSX.writeFile(wb, `Train_${trainNo}_${journeyLabel}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        if (!reportData || !reportData.lodge) return;

        const doc = new jsPDF("p", "mm", "a4");
        const trainNo = selectedTrain === "0" ? "Not Specified" : selectedTrain;
        const journeyLabel = journeyType === "arrival" ? "Arrival" : "Departure";

        // Add title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Train ${trainNo} - ${journeyLabel}`, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

        let tableData = [];
        let rowSpanInfo = [];

        const tableHeaders = [
            { header: "Lodge", dataKey: "lodge" },
            { header: "Room No", dataKey: "roomno" },
            { header: "Type", dataKey: "type" },
            { header: "Seat No", dataKey: "seatno" },
            { header: "ID No.", dataKey: "kkid" },
            { header: "Name", dataKey: "name" },
            { header: "Age", dataKey: "age" },
            { header: "Phone", dataKey: "phone" },
            { header: "Photo Id", dataKey: "photoid" },
        ];

        reportData.lodge.forEach((lodge) => {
            const validMembers = lodge.members || [];
            const memberCount = validMembers.length;

            validMembers.forEach((member, idx) => {
                tableData.push({
                    lodge: idx === 0 ? lodge.lodgename?.split("-")[1]?.replace(/_/g, " ") || lodge.lodgename : "",
                    roomno: member.roomno || "",
                    type: member.type || "",
                    seatno: member.seat_no || "",
                    kkid: member.KKID || "",
                    name: member.name || "",
                    age: `${member.sex || ""} ${member.age || ""}`,
                    phone: member.phone || "",
                    photoid: member.photoid || "",
                });

                rowSpanInfo.push({
                    isFirstInGroup: idx === 0,
                    memberCount: memberCount,
                    memberIndex: idx,
                });
            });
        });

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
                fontSize: 8,
            },
            bodyStyles: {
                fontSize: 7,
                cellPadding: 2,
                overflow: "linebreak",
                cellWidth: "wrap",
            },
            columnStyles: {
                0: { cellWidth: 35, halign: "left", valign: "middle", overflow: "linebreak" }, // Lodge
                1: { cellWidth: 15, halign: "center", overflow: "linebreak" }, // Room No
                2: { cellWidth: 12, halign: "center", overflow: "linebreak" }, // Type
                3: { cellWidth: 12, halign: "center", overflow: "linebreak" }, // Seat No
                4: { cellWidth: 22, overflow: "linebreak" }, // ID No
                5: { cellWidth: 35, overflow: "linebreak" }, // Name
                6: { cellWidth: 12, halign: "center", overflow: "linebreak" }, // Age
                7: { cellWidth: 20, overflow: "linebreak" }, // Phone
                8: { cellWidth: 22, overflow: "linebreak" }, // Photo Id
            },
            margin: { top: 25, right: 10, bottom: 10, left: 10 },
            didDrawCell: (data) => {
                // Remove top/bottom borders for lodge name cells in the same group
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

                            // Set styling for lodge cells
                            doc.setFontSize(7);
                            doc.setFont("helvetica", "bold");
                            doc.setTextColor(0, 0, 0);

                            // Redraw text for first cell
                            if (isFirst && data.cell.text && data.cell.text.length > 0) {
                                const lines = data.cell.text;
                                const lineHeight = 3.5;
                                const startY = data.cell.y + data.cell.padding("top") + lineHeight;

                                lines.forEach((line, i) => {
                                    doc.text(line, data.cell.x + data.cell.padding("left"), startY + (i * lineHeight));
                                });
                            }

                            // Draw borders
                            doc.setDrawColor(200, 200, 200);
                            doc.setLineWidth(0.1);

                            // Left border (always)
                            doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);

                            // Right border (always)
                            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);

                            // Top border (only for first)
                            if (isFirst) {
                                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                            } else {
                                // Cover top border with white
                                doc.setDrawColor(255, 255, 255);
                                doc.setLineWidth(0.3);
                                doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                                doc.setDrawColor(200, 200, 200);
                                doc.setLineWidth(0.1);
                            }

                            // Bottom border (only for last)
                            if (isLast) {
                                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                            } else {
                                // Cover bottom border with white
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

        doc.save(`Train_${trainNo}_${journeyLabel}.pdf`);
    };

    if (trainsLoading) {
        return <div className="m-2 p-2">Loading trains...</div>;
    }

    if (trainsError) {
        return <div className="m-2 p-2 text-red-500">Error loading trains</div>;
    }

    return (
        <div className="max-w-[1400px] mx-auto p-4">
            <div className="flex gap-4 items-end mb-4">
                <div className="flex-1">
                    <label className="block mb-2 font-semibold">Journey Type</label>
                    <Select value={journeyType} onValueChange={setJourneyType}>
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="arrival">Onwards Journey (Arrivals)</SelectItem>
                            <SelectItem value="depature">Return Journey (Departures)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1">
                    <label className="block mb-2 font-semibold">Train Number</label>
                    <Select value={selectedTrain} onValueChange={setSelectedTrain}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Train" />
                        </SelectTrigger>
                        <SelectContent>
                            {trains?.map((train) => (
                                <SelectItem key={train} value={train}>
                                    {train === "0" ? "Not Specified" : train}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {reportData && (
                    <div className="flex gap-2">
                        <Button
                            onClick={exportToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Export Excel
                        </Button>
                        <Button
                            onClick={exportToPDF}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Export PDF
                        </Button>
                    </div>
                )}
            </div>

            {isLoadingReport && (
                <div className="text-center py-4">Loading report...</div>
            )}

            {reportData && reportData.lodge && (
                <div>
                    <h2 className="text-xl font-bold mb-4 bg-gray-400 p-2 text-center">
                        Train {selectedTrain === "0" ? "Not Specified" : selectedTrain} - {journeyType === "arrival" ? "Arrivals" : "Departures"}
                    </h2>

                    <Table className="border table-fixed w-full">
                        <colgroup>
                            <col style={{width: '20%'}} />
                            <col style={{width: '10%'}} />
                            <col style={{width: '8%'}} />
                            <col style={{width: '8%'}} />
                            <col style={{width: '12%'}} />
                            <col style={{width: '18%'}} />
                            <col style={{width: '8%'}} />
                            <col style={{width: '10%'}} />
                            <col style={{width: '12%'}} />
                        </colgroup>
                        <TableHeader className="bg-gray-300">
                            <TableRow>
                                <TableHead className="border text-center text-xs p-2">Lodge</TableHead>
                                <TableHead className="border text-center text-xs p-2">Room No</TableHead>
                                <TableHead className="border text-center text-xs p-2">Type</TableHead>
                                <TableHead className="border text-center text-xs p-2">Seat No</TableHead>
                                <TableHead className="border text-center text-xs p-2">ID No.</TableHead>
                                <TableHead className="border text-center text-xs p-2">Name</TableHead>
                                <TableHead className="border text-center text-xs p-2">Age</TableHead>
                                <TableHead className="border text-center text-xs p-2">Phone</TableHead>
                                <TableHead className="border text-center text-xs p-2">Photo Id</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.lodge.map((lodge, lodgeIdx) => (
                                lodge.members?.map((member, memberIdx) => {
                                    return (
                                        <TableRow key={`${lodgeIdx}-${memberIdx}`}>
                                            {memberIdx === 0 ? (
                                                <TableCell
                                                    className="border text-left font-semibold bg-gray-100 text-xs p-2 break-word"
                                                    rowSpan={lodge.members.length}
                                                >
                                                    {lodge.lodgename?.split("-")[1]?.replace(/_/g, " ") || lodge.lodgename}
                                                </TableCell>
                                            ) : null}
                                            <TableCell className="border text-center text-xs p-2 break-word">{member.roomno || ""}</TableCell>
                                            <TableCell className="border text-center text-xs p-2 break-word">{member.type || ""}</TableCell>
                                            <TableCell className="border text-center text-xs p-2 break-word">{member.seat_no || ""}</TableCell>
                                            <TableCell className="border text-xs p-2 break-word">{member.KKID || ""}</TableCell>
                                            <TableCell className="border text-xs p-2 break-word">{member.name || ""}</TableCell>
                                            <TableCell className="border text-center text-xs p-2 break-word">
                                                {member.sex || ""} {member.age || ""}
                                            </TableCell>
                                            <TableCell className="border text-xs p-2 break-word">{member.phone || ""}</TableCell>
                                            <TableCell className="border text-xs p-2 break-word">{member.photoid || ""}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {!reportData && !isLoadingReport && (
                <div className="text-center py-8 text-gray-500">
                    Select a train to view the report
                </div>
            )}
        </div>
    );
};

const TrainWiseReport = () => {
    return (
        <WithAuth>
            <TrainWiseReportContent />
        </WithAuth>
    );
};

export default TrainWiseReport;
