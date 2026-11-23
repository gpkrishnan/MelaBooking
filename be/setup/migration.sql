-- MelaBooking: database migration for the "Related group" feature.
-- Adds a legend that ties related bookings together (same hotel, rooms close to each other).
-- Safe to run more than once (MariaDB: IF NOT EXISTS). The app also adds the column itself on first use
-- (ensure_related_group_column in be/lib/roomsplan.php), so running this by hand is optional.
--
-- Usage:  mysql -u <user> -p melarooms_pandharpur < be/setup/migration.sql

USE `melarooms_pandharpur`;

ALTER TABLE `families`
  ADD COLUMN IF NOT EXISTS `related_group` varchar(40) DEFAULT NULL
    COMMENT 'legend shared by related bookings (same hotel, rooms close together)',
  ADD INDEX IF NOT EXISTS `idx_families_related_group` (`related_group`);
