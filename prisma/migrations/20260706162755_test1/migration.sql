-- CreateEnum
CREATE TYPE "Role" AS ENUM ('farmer', 'admin');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('soil_testing', 'water_testing', 'labour_management', 'farming_equipment', 'fertilizer_management', 'pesticide_management', 'storage_request', 'group_forming', 'crop_selling');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'assigned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('image', 'pdf', 'other');

-- CreateEnum
CREATE TYPE "StaffSpecialization" AS ENUM ('soil', 'water', 'labour', 'equipment', 'fertilizer', 'pesticide', 'storage', 'general');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'busy', 'off_duty');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('member', 'leader');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "StorageAllocationStatus" AS ENUM ('reserved', 'active', 'vacated');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('open', 'matched', 'sold', 'cancelled');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('proposed', 'accepted', 'rejected', 'completed');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('soil', 'water');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('news', 'prevention_tip', 'farming_tip');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "areas" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "taluka" VARCHAR(150),
    "district" VARCHAR(150),
    "state" VARCHAR(150),
    "pincode" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "email" VARCHAR(150),
    "password_hash" VARCHAR(255),
    "role" "Role" NOT NULL,
    "area_id" BIGINT,
    "profile_image" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by_admin_id" BIGINT,
    "verified_at" TIMESTAMP(3),
    "language_pref" VARCHAR(20) NOT NULL DEFAULT 'en',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_profiles" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "farm_size_acres" DECIMAL(8,2),
    "land_location" VARCHAR(255),
    "primary_crops" VARCHAR(255),
    "land_survey_no" VARCHAR(100),

    CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ground_staff" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15),
    "area_id" BIGINT,
    "specialization" "StaffSpecialization",
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'available',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_admin_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ground_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15),
    "company_name" VARCHAR(200),
    "gst_no" VARCHAR(30),
    "preferred_crops" VARCHAR(255),
    "area_id" BIGINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_admin_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" BIGSERIAL NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "request_type" "RequestType" NOT NULL,
    "area_id" BIGINT,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'pending',
    "assigned_staff_id" BIGINT,
    "assigned_by_admin_id" BIGINT,
    "scheduled_date" DATE,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "file_url" VARCHAR(255) NOT NULL,
    "file_type" "AttachmentType" NOT NULL DEFAULT 'image',
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_status_logs" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "changed_by_user_id" BIGINT,
    "previous_status" VARCHAR(30),
    "new_status" VARCHAR(30),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "soil_test_details" (
    "request_id" BIGINT NOT NULL,
    "sample_location" VARCHAR(255),
    "land_area_acres" DECIMAL(8,2),
    "previous_crop" VARCHAR(150),

    CONSTRAINT "soil_test_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "water_test_details" (
    "request_id" BIGINT NOT NULL,
    "water_source" VARCHAR(50),
    "sample_location" VARCHAR(255),

    CONSTRAINT "water_test_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "labour_request_details" (
    "request_id" BIGINT NOT NULL,
    "labour_type" VARCHAR(100),
    "num_labourers_needed" INTEGER,
    "work_start_date" DATE,
    "duration_days" INTEGER,

    CONSTRAINT "labour_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "equipment_request_details" (
    "request_id" BIGINT NOT NULL,
    "equipment_type" VARCHAR(150),
    "quantity" INTEGER DEFAULT 1,
    "rental_duration_days" INTEGER,
    "preferred_date" DATE,

    CONSTRAINT "equipment_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "fertilizer_request_details" (
    "request_id" BIGINT NOT NULL,
    "fertilizer_type" VARCHAR(150),
    "quantity_kg" DECIMAL(10,2),
    "crop_type" VARCHAR(150),

    CONSTRAINT "fertilizer_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "pesticide_request_details" (
    "request_id" BIGINT NOT NULL,
    "pesticide_type" VARCHAR(150),
    "quantity_needed" DECIMAL(10,2),
    "pest_issue_description" TEXT,

    CONSTRAINT "pesticide_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "storage_request_details" (
    "request_id" BIGINT NOT NULL,
    "crop_type" VARCHAR(150),
    "quantity_kg" DECIMAL(10,2),
    "storage_duration_days" INTEGER,
    "preferred_start_date" DATE,

    CONSTRAINT "storage_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "group_forming_request_details" (
    "request_id" BIGINT NOT NULL,
    "purpose" VARCHAR(255),
    "crop_type" VARCHAR(150),
    "min_members" INTEGER,

    CONSTRAINT "group_forming_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "crop_selling_request_details" (
    "request_id" BIGINT NOT NULL,
    "crop_type" VARCHAR(150),
    "quantity_kg" DECIMAL(10,2),
    "expected_price" DECIMAL(10,2),
    "harvest_date" DATE,

    CONSTRAINT "crop_selling_request_details_pkey" PRIMARY KEY ("request_id")
);

-- CreateTable
CREATE TABLE "farmer_groups" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "purpose" VARCHAR(255),
    "crop_type" VARCHAR(150),
    "area_id" BIGINT,
    "created_by_admin_id" BIGINT,
    "status" "GroupStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "farmer_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" BIGSERIAL NOT NULL,
    "group_id" BIGINT NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_units" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(200),
    "location" VARCHAR(255),
    "area_id" BIGINT,
    "total_capacity_kg" DECIMAL(12,2),
    "available_capacity_kg" DECIMAL(12,2),

    CONSTRAINT "storage_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_allocations" (
    "id" BIGSERIAL NOT NULL,
    "storage_unit_id" BIGINT NOT NULL,
    "request_id" BIGINT NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "allocated_capacity_kg" DECIMAL(12,2),
    "start_date" DATE,
    "end_date" DATE,
    "status" "StorageAllocationStatus" NOT NULL DEFAULT 'reserved',
    "allocated_by_admin_id" BIGINT,

    CONSTRAINT "storage_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_listings" (
    "id" BIGSERIAL NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "request_id" BIGINT NOT NULL,
    "crop_type" VARCHAR(150),
    "quantity_kg" DECIMAL(10,2),
    "asking_price" DECIMAL(10,2),
    "status" "ListingStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crop_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_matches" (
    "id" BIGSERIAL NOT NULL,
    "crop_listing_id" BIGINT NOT NULL,
    "buyer_id" BIGINT NOT NULL,
    "matched_by_admin_id" BIGINT,
    "offered_price" DECIMAL(10,2),
    "status" "MatchStatus" NOT NULL DEFAULT 'proposed',
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_reports" (
    "id" BIGSERIAL NOT NULL,
    "request_id" BIGINT NOT NULL,
    "report_type" "ReportType" NOT NULL,
    "raw_file_url" VARCHAR(255) NOT NULL,
    "uploaded_by_admin_id" BIGINT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simplified_reports" (
    "id" BIGSERIAL NOT NULL,
    "lab_report_id" BIGINT NOT NULL,
    "summary_text" TEXT,
    "health_score" DECIMAL(5,2),
    "key_parameters" JSONB,
    "recommendations" TEXT,
    "language" VARCHAR(20) NOT NULL DEFAULT 'en',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simplified_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disease_detection_logs" (
    "id" BIGSERIAL NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "detected_disease" VARCHAR(200),
    "confidence_score" DECIMAL(5,2),
    "recommendation" TEXT,
    "crop_type" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disease_detection_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_alerts" (
    "id" BIGSERIAL NOT NULL,
    "area_id" BIGINT NOT NULL,
    "alert_type" VARCHAR(100),
    "message" TEXT,
    "severity" "Severity" NOT NULL DEFAULT 'medium',
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "source" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "irrigation_recommendations" (
    "id" BIGSERIAL NOT NULL,
    "farmer_id" BIGINT NOT NULL,
    "area_id" BIGINT,
    "crop_type" VARCHAR(150),
    "recommendation_text" TEXT,
    "water_amount_liters" DECIMAL(10,2),
    "recommended_date" DATE,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "irrigation_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "light_schedules" (
    "id" BIGSERIAL NOT NULL,
    "area_id" BIGINT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "uploaded_by_admin_id" BIGINT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "light_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mcb_contacts" (
    "id" BIGSERIAL NOT NULL,
    "area_id" BIGINT NOT NULL,
    "contact_name" VARCHAR(150),
    "designation" VARCHAR(100),
    "phone_number" VARCHAR(15),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcb_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agri_content" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "image_url" VARCHAR(255),
    "area_id" BIGINT,
    "published_by_admin_id" BIGINT,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agri_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" VARCHAR(200),
    "message" TEXT,
    "type" VARCHAR(50),
    "reference_id" BIGINT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_user_id_key" ON "farmer_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_farmer_id_key" ON "group_members"("group_id", "farmer_id");

-- CreateIndex
CREATE UNIQUE INDEX "simplified_reports_lab_report_id_key" ON "simplified_reports"("lab_report_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_verified_by_admin_id_fkey" FOREIGN KEY ("verified_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ground_staff" ADD CONSTRAINT "ground_staff_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ground_staff" ADD CONSTRAINT "ground_staff_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyers" ADD CONSTRAINT "buyers_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "ground_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_by_admin_id_fkey" FOREIGN KEY ("assigned_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_logs" ADD CONSTRAINT "request_status_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_logs" ADD CONSTRAINT "request_status_logs_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "soil_test_details" ADD CONSTRAINT "soil_test_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_test_details" ADD CONSTRAINT "water_test_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_request_details" ADD CONSTRAINT "labour_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_request_details" ADD CONSTRAINT "equipment_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_request_details" ADD CONSTRAINT "fertilizer_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pesticide_request_details" ADD CONSTRAINT "pesticide_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_request_details" ADD CONSTRAINT "storage_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_forming_request_details" ADD CONSTRAINT "group_forming_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_selling_request_details" ADD CONSTRAINT "crop_selling_request_details_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_groups" ADD CONSTRAINT "farmer_groups_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_groups" ADD CONSTRAINT "farmer_groups_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "farmer_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_units" ADD CONSTRAINT "storage_units_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_allocations" ADD CONSTRAINT "storage_allocations_storage_unit_id_fkey" FOREIGN KEY ("storage_unit_id") REFERENCES "storage_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_allocations" ADD CONSTRAINT "storage_allocations_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_allocations" ADD CONSTRAINT "storage_allocations_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_allocations" ADD CONSTRAINT "storage_allocations_allocated_by_admin_id_fkey" FOREIGN KEY ("allocated_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_listings" ADD CONSTRAINT "crop_listings_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_listings" ADD CONSTRAINT "crop_listings_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_matches" ADD CONSTRAINT "buyer_matches_crop_listing_id_fkey" FOREIGN KEY ("crop_listing_id") REFERENCES "crop_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_matches" ADD CONSTRAINT "buyer_matches_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "buyers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_matches" ADD CONSTRAINT "buyer_matches_matched_by_admin_id_fkey" FOREIGN KEY ("matched_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_uploaded_by_admin_id_fkey" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simplified_reports" ADD CONSTRAINT "simplified_reports_lab_report_id_fkey" FOREIGN KEY ("lab_report_id") REFERENCES "lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_detection_logs" ADD CONSTRAINT "disease_detection_logs_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_alerts" ADD CONSTRAINT "weather_alerts_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_recommendations" ADD CONSTRAINT "irrigation_recommendations_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irrigation_recommendations" ADD CONSTRAINT "irrigation_recommendations_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "light_schedules" ADD CONSTRAINT "light_schedules_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "light_schedules" ADD CONSTRAINT "light_schedules_uploaded_by_admin_id_fkey" FOREIGN KEY ("uploaded_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mcb_contacts" ADD CONSTRAINT "mcb_contacts_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_content" ADD CONSTRAINT "agri_content_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agri_content" ADD CONSTRAINT "agri_content_published_by_admin_id_fkey" FOREIGN KEY ("published_by_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
