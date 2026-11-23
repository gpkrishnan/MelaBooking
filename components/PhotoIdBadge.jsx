"use client";
import useSWR from "swr";
import fetcher from "@/db/fetcher";

export const photoIdKey = (digits) => `photoid:${digits}`;
export const normalizePhotoId = (v) => String(v || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();

// Small status chip: is a photo ID image stored for this member's ID number?
export default function PhotoIdBadge({ photoid }) {
    const digits = normalizePhotoId(photoid);
    const valid = digits.length >= 6;
    const { data, error } = useSWR(valid ? photoIdKey(digits) : null, () => fetcher(`data/aadhaar_info.php?aadhaar=${digits}`, { auth: true }), { revalidateOnFocus: false });
    if (!valid) return <span className="text-gray-400 text-xs">No ID no.</span>;
    if (error) return <span className="text-gray-400 text-xs">?</span>;
    if (!data) return <span className="text-gray-400 text-xs">…</span>;
    return data.found ? (
        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Submitted</span>
    ) : (
        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Pending</span>
    );
}
