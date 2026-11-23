<?php
// ── Melabooking_dev Backend Configuration ──
// NOTE: The live backend is /gpk/melahotel/be/ (pointed to by NEXT_PUBLIC_BACKEND_API_URL)
// This file is for reference / Melabooking_dev local backend use only.

// KKCRT database credentials
define('KKCRT_DB_HOST', 'localhost');
define('KKCRT_DB_USER', 'prakash');
define('KKCRT_DB_PASS', 'Gpkrts2*');
define('KKCRT_DB_NAME', 'KKCRT');

// Melabooking database credentials
// melahotel project → melarooms_guruvayur
// Melabooking_dev project → melarooms_pandharpur (Pandharpur Mela 2027); pre-registration tables (group_head etc.) are in the same database
define('MELA_DB_HOST', 'localhost');
define('MELA_DB_USER', 'prakash');
define('MELA_DB_PASS', 'Gpkrts2*');
define('MELA_DB_NAME', 'melarooms_pandharpur');
