/**
 * Fetcher function for useSWR with GET and POST support
 * @param {string} url - The URL to fetch data from
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method ('GET' or 'POST')
 * @param {Object} options.data - Data to send (for POST requests)
 * @returns {Promise} - Promise resolving to the parsed JSON response
 */
export const fetcher = async (baseurl, options = {}) => {
    const { method = "GET", data, auth = false, ...restOptions } = options;
    const url = process.env.NEXT_PUBLIC_BACKEND_API_URL + baseurl;
    const fetchOptions = {
        method,
        ...restOptions,
    };
    // auth: true -> send the admin token (only used for the newer protected endpoints)
    if (auth && typeof window !== "undefined") {
        const token = localStorage.getItem("adminToken");
        if (token) fetchOptions.headers = { Authorization: `Bearer ${token}`, ...fetchOptions.headers };
    }

    // For POST requests with data
    if (method === "POST" && data) {
        fetchOptions.headers = {
            "Content-Type": "application/json",
            ...fetchOptions.headers,
        };
        fetchOptions.body = JSON.stringify(data);
    }

    const res = await fetch(url, fetchOptions);

    // If the status code is not in the range 200-299,
    // we still try to parse and throw it.
    if (!res.ok) {
        const error = new Error("An error occurred while fetching the data.");
        // Attach extra info to the error object
        try {
            error.info = await res.json();
        } catch {
            error.info = null;
        }
        error.status = res.status;
        throw error;
    }

    return res.json();
};

// Helper functions for convenience
export const fetcherGET = (url) => fetcher(url, { method: "GET" });

export const fetcherPOST = (url, data) => fetcher(url, { method: "POST", data });

export default fetcher;
