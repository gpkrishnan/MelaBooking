// Names look like "<prefix>-<Hotel_Name>"; tolerate missing/odd values.
export function formatHotelName(name) {
    if (typeof name !== "string" || !name) return "";
    const parts = name.split("-");
    return (parts[1] ?? parts[0]).replaceAll("_", " ");
}
