/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    output: "export",
    // Set NEXT_PUBLIC_BASE_PATH (e.g. /gpk/melabooking) at build time when the exported `out` folder is served from a sub-folder
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
    trailingSlash: true,
    images: { unoptimized: true },

    reactCompiler: true,
};

export default nextConfig;
