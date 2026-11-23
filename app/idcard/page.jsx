"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import html2canvas from "html2canvas-pro";
import JSZip from "jszip";

const API_URL = "https://www.krishnakudumbam.in/gpk/melabooking/be/data/iddata.php";

// Blank ID Card component - same layout without personal details
function BlankIdCard() {
    return (
        <div className="id-card w-[83mm] h-[47.5mm] p-0 gap-0 overflow-hidden border-2" style={{ borderColor: "#facc15" }}>
            <div className="grid grid-cols-3 h-full">
                <div className="h-full relative" style={{ background: "linear-gradient(to bottom, #bef264, rgba(232,121,249,0.7), #1d4ed8)" }}>
                    <svg className="absolute top-1/2 left-0 -translate-y-1/2 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,0 Q25,0 0,0 T100,35 L100,65 Q75,58 50,62 T0,58 Z" fill="rgba(255,215,0,0.3)" />
                    </svg>
                    <span className="relative z-10 h-full flex items-center justify-center" style={{ color: "#ffffff" }}>
                        <img src="/GA.png" className="w-[70px] h-[100px] object-contain drop-shadow-md" alt="" />
                    </span>
                </div>
                <div className="col-span-2 h-full py-[2mm] relative flex flex-col justify-between" style={{ backgroundColor: "transparent" }}>
                    <div className="w-full flex flex-col items-center font-bold" style={{ color: "#be185d", borderBottom: "1px solid #e5e7eb" }}>
                        <div className="text-[12px] uppercase">Nama Sankeerthana Mela</div>
                        <div className="text-[10px] uppercase">Pandharpur</div>
                        <div className="text-[9px]">12th ~ 15th Feb 2026</div>
                    </div>
                    <div className="w-full text-center font-semibold text-[8px]" style={{ color: "#7c3aed", borderBottom: "1px solid #e5e7eb" }}>Venue: Rugmini Regency East Nada</div>
                    <div className="grow flex flex-col justify-center items-center py-1 uppercase">
                        <div className="w-full text-center">
                            <b className="font-[12px] uppercase" style={{ color: "#312e81" }}>&nbsp;</b>
                        </div>
                    </div>
                    <div className="w-full px-4 flex items-center justify-between text-[8px] font-bold" style={{ color: "#d97706" }}>
                        <div>&nbsp;</div>
                        <div>&nbsp;</div>
                    </div>
                    <div className="flex items-center justify-between pt-1 px-1" style={{ borderTop: "1px solid #e5e7eb" }}>
                        <img src="/logo.png" className="w-[30px] h-[30px] object-contain" alt="" />
                        <div className="w-full flex flex-col px-1 text-xs font-bold items-center" style={{ color: "#4338ca" }}>
                            <div className="uppercase text-[10px]">Krishna Kudumbam</div>
                            <div className="uppercase text-[7px]">Charitable & Relegious Trust</div>
                            <div className="uppercase text-[7px]">99439 11030</div>
                        </div>
                        <img src="/rajgopal.png" className="w-[30px] h-[30px] object-cover rounded-full" alt="" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ID Card component - Credit card size: 85.6mm x 53.98mm
function IdCard({ person }) {
    return (
        <div className="id-card w-[83mm] h-[47.5mm] p-0 gap-0 overflow-hidden border-2" style={{ borderColor: "#facc15" }}>
            <div className="grid grid-cols-3 h-full">
                {/* <div className="relative rounded-r bg-linear-to-b from-yellow-200 via-amber-300 to-indigo-600 h-full p-[3mm] overflow-hidden"> */}
                    {/* Gold glitter effect */}
                    {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.8)_1px,transparent_1px),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.6)_1px,transparent_1px),radial-gradient(circle_at_40%_70%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_70%_60%,rgba(255,255,255,0.5)_1px,transparent_1px),radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.6)_1px,transparent_1px),radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.7)_1px,transparent_1px),radial-gradient(circle_at_10%_80%,rgba(255,255,255,0.5)_1px,transparent_1px),radial-gradient(circle_at_90%_90%,rgba(255,255,255,0.6)_1px,transparent_1px)]"></div> */}
                    {/* Gold wave effect at center */}
                    {/* <svg className="absolute top-1/2 left-0 -translate-y-1/2 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,0 Q25,0 0,0 T100,35 L100,65 Q75,58 50,62 T0,58 Z" fill="rgba(255,215,0,0.3)" />
                   
                    </svg> */}
                <div className="h-full relative" style={{ background: "linear-gradient(to bottom, #bef264, rgba(232,121,249,0.7), #1d4ed8)" }}>
                 
  <svg className="absolute top-1/2 left-0 -translate-y-1/2 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,0 Q25,0 0,0 T100,35 L100,65 Q75,58 50,62 T0,58 Z" fill="rgba(255,215,0,0.3)" />
                   
                    </svg>
                    <span className="relative z-10 h-full flex items-center justify-center" style={{ color: "#ffffff" }}>
                        <img src="/GA.png" className="w-[70px] h-[100px] object-contain drop-shadow-md" alt="" />
                    </span>
                </div>
                <div className="col-span-2 h-full py-[2mm] relative flex flex-col justify-between" style={{ backgroundColor: "transparent" }}>
                    <div className="w-full flex flex-col items-center font-bold" style={{ color: "#be185d", borderBottom: "1px solid #e5e7eb" }}>
                        <div className="text-[12px] uppercase">Nama Sankeerthana Mela</div>
                        <div className="text-[10px] uppercase">Pandharpur</div>
                        <div className="text-[9px]">12th ~ 15th Feb 2026</div>
                    </div>
                    <div className="w-full text-center font-semibold text-[8px]" style={{ color: "#7c3aed", borderBottom: "1px solid #e5e7eb" }}>Venue: Rugmini Regency East Nada</div>
                    <div className="grow flex flex-col justify-center items-center py-1 uppercase ">
                        <div className="w-full text-center">
                            <b className="font-[12px] uppercase" style={{ color: "#312e81" }}>{person.name}</b>
                        </div>
                    </div>
                    <div className="w-full px-4 flex items-center justify-between text-[8px] font-bold" style={{ color: "#d97706" }}>
                        <div>{person.regnNo}</div>
                       
                        <div>{person.mc} / {person.code} </div>
                    </div>
                    <div className="flex items-center justify-between pt-1 px-1" style={{ borderTop: "1px solid #e5e7eb" }}>
                        <img src="/logo.png" className="w-[30px] h-[30px] object-contain" alt="" />
                        <div className="w-full flex flex-col px-1 text-xs font-bold items-center" style={{ color: "#4338ca" }}>
                            <div className="uppercase text-[10px]">Krishna Kudumbam</div>
                            <div className="uppercase text-[7px]">Charitable & Relegious Trust</div>
                            <div className="uppercase text-[7px]">99439 11030</div>
                        </div>
                        <img src="/rajgopal.png" className="w-[30px] h-[30px] object-cover rounded-full" alt="" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Idcard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [generating, setGenerating] = useState(false);
    const pagesRef = useRef([]);

    useEffect(() => {
        fetch(API_URL)
            .then((res) => res.json())
            .then((json) => {
                setData(json);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    const handleDownload = async () => {
        if (generating) return;
        setGenerating(true);

        try {
            // Wait for images to fully load
            await new Promise((resolve) => setTimeout(resolve, 500));

            // A3 landscape at 300 DPI: 4960 x 3508 pixels
            // We use scale factor to achieve high DPI from the 420mm x 297mm layout
            // 420mm at 300dpi = 4960px, element is 420mm wide in CSS
            // scale = 4960 / element.offsetWidth
            const zip = new JSZip();

            for (let i = 0; i < pagesRef.current.length; i++) {
                const pageElement = pagesRef.current[i];
                if (!pageElement) continue;

                const dpiScale = (4960 / pageElement.offsetWidth);

                const canvas = await html2canvas(pageElement, {
                    scale: dpiScale,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: "#fffbeb",
                    logging: false,
                    imageTimeout: 0,
                });

                // Convert to high-quality JPEG blob
                const blob = await new Promise((resolve) =>
                    canvas.toBlob(resolve, "image/jpeg", 0.95)
                );

                const fileName = i < pagesRef.current.length - 1
                    ? `id-cards-page-${i + 1}.jpg`
                    : `id-cards-blank-sheet.jpg`;
                zip.file(fileName, blob);
            }

            // Generate and download zip
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "id-cards.zip";
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating images:", err);
            alert("Error generating images: " + err.message);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }

    const CARDS_PER_PAGE = 30;
    const pages = [];
    for (let i = 0; i < data.length; i += CARDS_PER_PAGE) {
        pages.push(data.slice(i, i + CARDS_PER_PAGE));
    }

    return (
        <div className="p-0 print:p-0">
            {/* Print button - hidden when printing */}
            <div className="mb-[5mm] text-center print:hidden">
                <Button onClick={handleDownload} size="lg" disabled={generating}>
                    <Printer className="mr-[2mm] h-[4mm] w-[4mm]" />
                    {generating ? "Generating JPEGs..." : "Download JPEGs (A3)"}
                </Button>
                <p className="mt-[2mm] text-[3.5mm] text-muted-foreground">Total cards: {data.length} | Cards per A3 sheet: 30 | Pages: {pages.length + 1} (includes 1 blank sheet)</p>
            </div>

            {/* ID Cards Grid - 5 columns x 6 rows for A3 */}
            {pages.map((pageData, pageIndex) => (
                <div
                    key={pageIndex}
                    ref={(el) => (pagesRef.current[pageIndex] = el)}
                    className="printable-sheet grid gap-0 w-[420mm] mx-auto h-[297mm] py-[3mm] items-center justify-between overflow-hidden grid-cols-5 grid-rows-6 print:break-after-page"
                    style={{ backgroundColor: "rgba(254,243,199,0.5)" }}
                >
                    {pageData.map((person, index) => (
                        <IdCard key={`${person.mc}-${index}`} person={person} />
                    ))}
                    {/* Fill remaining slots on last page with blank cards */}
                    {pageData.length < CARDS_PER_PAGE &&
                        Array.from({ length: CARDS_PER_PAGE - pageData.length }).map((_, index) => (
                            <BlankIdCard key={`filler-${index}`} />
                        ))
                    }
                </div>
            ))}

            {/* Blank ID card sheet - 30 blank cards */}
            <div
                ref={(el) => (pagesRef.current[pages.length] = el)}
                className="printable-sheet grid gap-0 w-[420mm] mx-auto h-[297mm] py-[3mm] items-center justify-between overflow-hidden grid-cols-5 grid-rows-6 print:break-after-page"
                style={{ backgroundColor: "rgba(254,243,199,0.5)" }}
            >
                {Array.from({ length: 30 }).map((_, index) => (
                    <BlankIdCard key={`blank-${index}`} />
                ))}
            </div>
        </div>
    );
}

export default Idcard;
