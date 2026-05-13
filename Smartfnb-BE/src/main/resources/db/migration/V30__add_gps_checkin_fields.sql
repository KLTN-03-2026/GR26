-- ==============================================================================
-- V30: Add GPS Check-in Fields
-- ==============================================================================

-- 1. Thêm cột tọa độ và khoảng cách check-in cho ca làm việc
ALTER TABLE shift_schedules
  ADD COLUMN IF NOT EXISTS checkin_latitude  DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS checkin_longitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS checkin_distance_meters INT;

-- 2. Thêm ngưỡng khoảng cách cho phép check-in theo từng chi nhánh (mặc định 200m)
ALTER TABLE branches
  ADD COLUMN IF NOT EXISTS gps_checkin_radius_meters INT NOT NULL DEFAULT 200;
