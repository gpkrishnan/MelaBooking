-- MelaBooking: initial database structure for melarooms_pandharpur (Pandharpur Mela 2027).
-- Structure only: no data, no users, no tariff rates, no trains.
-- Generated with mysqldump --no-data from the live local database.
--
-- Usage (empty server):  mysql -u <user> -p < be/setup/init.sql
--
-- NOT included: the KKCRT database (ledger, receipt_member, sno) used by be/actions/bulk_post_receipts.php.
-- Registration number = 5100 + family id (ids 1-100 are for admin bookings; pre-registrations start at 101).

CREATE DATABASE IF NOT EXISTS `melarooms_pandharpur` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `melarooms_pandharpur`;
SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `aadhaar_docs` (
  `doc_id` int(11) NOT NULL AUTO_INCREMENT,
  `aadhaar_hash` char(64) NOT NULL,
  `last4` char(4) NOT NULL,
  `file_name` varchar(80) NOT NULL,
  `orig_name` varchar(200) DEFAULT NULL,
  `mime` varchar(50) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`doc_id`),
  UNIQUE KEY `uq_aadhaar_hash` (`aadhaar_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `arr_bus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kkid` varchar(15) DEFAULT NULL,
  `bus` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `beds` (
  `bedid` int(11) NOT NULL AUTO_INCREMENT,
  `roomid` int(11) NOT NULL,
  `cot` varchar(2) NOT NULL,
  `bed` int(1) NOT NULL,
  `valid` int(1) NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`bedid`),
  KEY `roomid` (`roomid`),
  CONSTRAINT `beds_ibfk_1` FOREIGN KEY (`roomid`) REFERENCES `rooms` (`roomid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `brn` (
  `brnid` int(11) NOT NULL AUTO_INCREMENT,
  `familyid` int(11) NOT NULL,
  `booking_date` date NOT NULL,
  `bill_amount` int(11) DEFAULT NULL,
  `recd_amount` int(11) DEFAULT NULL,
  `receipt_date` date DEFAULT NULL,
  `pay_mode` varchar(1) DEFAULT NULL COMMENT 'B:Bank, C:Cash, O:Others',
  `paymentdetails` text DEFAULT NULL,
  `booking_status` varchar(1) DEFAULT NULL COMMENT 'R:Reserved B:Booking Confirmed, C:canceled: A: Blocked-By  Admin',
  `RECEIPT_NO` varchar(15) DEFAULT NULL,
  `RECEIPT_DATED` date DEFAULT NULL,
  `LE_ID` int(11) DEFAULT NULL,
  PRIMARY KEY (`brnid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `change_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_head_id` int(11) NOT NULL,
  `type` varchar(10) NOT NULL,
  `details` text NOT NULL,
  `status` char(1) NOT NULL DEFAULT 'O',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `done_at` datetime DEFAULT NULL,
  `done_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `change_requests_fk` (`group_head_id`),
  CONSTRAINT `change_requests_fk` FOREIGN KEY (`group_head_id`) REFERENCES `group_head` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `citygroup` (
  `citygrpid` int(11) NOT NULL AUTO_INCREMENT,
  `groupname` varchar(50) NOT NULL,
  `remarks` varchar(100) NOT NULL,
  PRIMARY KEY (`citygrpid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `dep_bus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kkid` varchar(15) DEFAULT NULL,
  `bus` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `devotee_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `aadhaar_no` varchar(50) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `sex` char(1) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `whatsapp` char(10) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `source_event` varchar(50) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dm_aadhaar` (`aadhaar_no`),
  KEY `idx_dm_whatsapp` (`whatsapp`),
  KEY `idx_dm_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `families` (
  `familyid` int(11) NOT NULL AUTO_INCREMENT,
  `leader` varchar(50) NOT NULL,
  `city` varchar(50) NOT NULL,
  `citygroup` int(11) NOT NULL,
  `whatsapp` varchar(15) DEFAULT NULL,
  `phone2` varchar(15) DEFAULT NULL,
  `fremarks` longtext DEFAULT NULL,
  `address` text DEFAULT NULL,
  `uuid` varchar(40) DEFAULT NULL,
  `room_category` varchar(50) DEFAULT NULL,
  `prereg_id` int(11) DEFAULT NULL,
  `submit_token` varchar(40) DEFAULT NULL,
  `rooms_plan` varchar(60) DEFAULT NULL,
  `share_with` int(11) DEFAULT NULL,
  `combine_no` int(11) DEFAULT NULL,
  PRIMARY KEY (`familyid`),
  UNIQUE KEY `uq_families_submit_token` (`submit_token`),
  KEY `idx_families_whatsapp` (`whatsapp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `google_contacts` (
  `phone10` char(10) NOT NULL,
  `resource_name` varchar(100) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`phone10`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `group_head` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `gender` char(1) NOT NULL DEFAULT 'M',
  `phone` varchar(20) NOT NULL,
  `whatsapp` char(10) NOT NULL,
  `aadhaar_no` varchar(50) DEFAULT NULL,
  `photo_id_aadhar` varchar(50) DEFAULT NULL,
  `address` text NOT NULL,
  `city` varchar(100) DEFAULT NULL,
  `room_type` varchar(10) NOT NULL,
  `rooms_plan` varchar(100) DEFAULT NULL,
  `est_amount` int(11) DEFAULT NULL,
  `est_unpriced` tinyint(4) NOT NULL DEFAULT 0,
  `emergency_contact_name` varchar(255) NOT NULL,
  `emergency_contact_phone` varchar(20) NOT NULL,
  `emergency_contact_relation` varchar(100) DEFAULT NULL,
  `volunteer` tinyint(4) NOT NULL DEFAULT 0,
  `travel_mode` varchar(10) DEFAULT NULL,
  `arrival_at` datetime DEFAULT NULL,
  `departure_at` datetime DEFAULT NULL,
  `onward_train_id` int(11) DEFAULT NULL,
  `onward_pickup` tinyint(4) NOT NULL DEFAULT 0,
  `return_train_id` int(11) DEFAULT NULL,
  `return_pickup` tinyint(4) NOT NULL DEFAULT 0,
  `lang` char(2) NOT NULL DEFAULT 'en',
  `submit_token` varchar(40) NOT NULL,
  `status` char(1) NOT NULL DEFAULT 'N',
  `mela_regn_id` int(11) DEFAULT NULL,
  `booking_status` char(1) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `instructions_version` varchar(20) DEFAULT NULL,
  `instructions_accepted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `onward_other_no` varchar(20) DEFAULT NULL,
  `onward_other_at` datetime DEFAULT NULL,
  `return_other_no` varchar(20) DEFAULT NULL,
  `return_other_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_whatsapp` (`whatsapp`),
  UNIQUE KEY `uq_submit_token` (`submit_token`),
  KEY `idx_phone` (`phone`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_head_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `age` int(11) NOT NULL,
  `gender` char(1) NOT NULL DEFAULT 'M',
  `phone` varchar(20) DEFAULT NULL,
  `aadhaar_no` varchar(50) DEFAULT NULL,
  `photo_id_aadhar` varchar(50) DEFAULT NULL,
  `volunteer` tinyint(4) NOT NULL DEFAULT 0,
  `onward_train_id` int(11) DEFAULT NULL,
  `onward_pickup` tinyint(4) NOT NULL DEFAULT 0,
  `return_train_id` int(11) DEFAULT NULL,
  `return_pickup` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `onward_other_no` varchar(20) DEFAULT NULL,
  `onward_other_at` datetime DEFAULT NULL,
  `return_other_no` varchar(20) DEFAULT NULL,
  `return_other_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_group_head_id` (`group_head_id`),
  CONSTRAINT `group_members_ibfk_1` FOREIGN KEY (`group_head_id`) REFERENCES `group_head` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `hotelAddress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(5) NOT NULL,
  `hotelname` varchar(100) NOT NULL,
  `address` varchar(150) DEFAULT NULL,
  `phoneNo` varchar(50) DEFAULT NULL,
  `distance_to_venue` int(11) NOT NULL,
  `maplink` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE IF NOT EXISTS `members` (
  `memberid` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `sex` varchar(1) NOT NULL DEFAULT 'M' COMMENT 'M:Male, F:Female ',
  `age` int(2) NOT NULL DEFAULT 20,
  `familyid` int(11) NOT NULL,
  `p_roomtype` varchar(1) NOT NULL DEFAULT 'N' COMMENT 'N: non AC, A:AC',
  `p_toilet` varchar(1) NOT NULL DEFAULT 'N' COMMENT 'N: Not specific I: Indian W:western',
  `p_floor` varchar(1) NOT NULL DEFAULT 'N' COMMENT 'N:not specifiv L: Lower Floor, U:Upperfloor ',
  `p_cot` varchar(1) NOT NULL DEFAULT 'N' COMMENT 'N: not speific, R:Required, E: Only Extra-bed',
  `bedid` int(11) DEFAULT NULL,
  `arr_mode` varchar(1) DEFAULT 'O' COMMENT 'T:Train, O:Others',
  `arr_train_no` varchar(50) DEFAULT '-',
  `arr_seat_no` varchar(15) DEFAULT '-',
  `dep_seat_no` varchar(15) DEFAULT '-',
  `arr_train_time` datetime DEFAULT NULL,
  `arr_city` varchar(10) DEFAULT NULL,
  `pickup_bus` int(1) NOT NULL DEFAULT 1 COMMENT '1:Required 0:Not required',
  `checkin_time` datetime DEFAULT NULL,
  `checkout_time` datetime DEFAULT NULL,
  `dep_mode` varchar(1) DEFAULT 'O' COMMENT 'T: Train O:others',
  `dep_train_no` varchar(50) DEFAULT '-',
  `dep_time` datetime DEFAULT NULL,
  `dep_city` varchar(10) DEFAULT NULL,
  `drop_bus` int(1) NOT NULL DEFAULT 1 COMMENT '1: Required, 0: Not required',
  `photoidno` varchar(100) DEFAULT NULL,
  `title` varchar(3) DEFAULT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `KKID` varchar(12) DEFAULT NULL,
  `arr_bus_no` int(11) DEFAULT NULL,
  `dep_bus_no` int(11) DEFAULT NULL,
  `aadhaar_doc_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`memberid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `rooms` (
  `roomid` int(11) NOT NULL AUTO_INCREMENT,
  `lodgename` varchar(100) NOT NULL,
  `roomno` varchar(8) NOT NULL,
  `actype` int(1) NOT NULL DEFAULT 0 COMMENT '0:non AC 1: AC, 2 - Dormitory',
  `toilet` int(1) NOT NULL DEFAULT 1 COMMENT '0: Indian !: Western',
  `bedtype` varchar(10) NOT NULL,
  `floor` varchar(2) DEFAULT NULL,
  `rate` int(11) DEFAULT NULL,
  PRIMARY KEY (`roomid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `tariff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_type` varchar(3) NOT NULL,
  `occupancy` tinyint(4) NOT NULL,
  `rate_per_person` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tariff` (`room_type`,`occupancy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `train_master` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `direction` varchar(6) NOT NULL,
  `train_no` varchar(20) NOT NULL,
  `train_name` varchar(100) DEFAULT NULL,
  `station` varchar(12) NOT NULL,
  `travel_date` date DEFAULT NULL,
  `time_text` varchar(120) DEFAULT NULL,
  `pickup_arranged` tinyint(4) NOT NULL DEFAULT 0,
  `active` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `valid` int(1) NOT NULL DEFAULT 1,
  `remarks` varchar(100) DEFAULT NULL,
  `password` varchar(30) NOT NULL,
  `login` int(1) NOT NULL DEFAULT 1,
  `admin` int(1) NOT NULL DEFAULT 0,
  `api_token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
