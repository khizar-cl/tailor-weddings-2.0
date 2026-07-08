CREATE TABLE "vendor_services" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vendor_business_id" integer NOT NULL,
	"category_id" integer,
	"custom_label" text,
	"description" text,
	"starting_price_cents" integer,
	"price_unit" "price_unit" DEFAULT 'flat' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"details" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vendor_services_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "vendor_services_business_category_uniq" UNIQUE("vendor_business_id","category_id"),
	CONSTRAINT "vendor_services_category_xor_custom_chk" CHECK (("vendor_services"."category_id" is not null) <> ("vendor_services"."custom_label" is not null))
);
--> statement-breakpoint
ALTER TABLE "vendor_profiles" RENAME TO "vendor_businesses";--> statement-breakpoint
ALTER TABLE "bookings" RENAME COLUMN "vendor_profile_id" TO "vendor_business_id";--> statement-breakpoint
ALTER TABLE "budget_items" RENAME COLUMN "vendor_profile_id" TO "vendor_business_id";--> statement-breakpoint
ALTER TABLE "conversations" RENAME COLUMN "vendor_profile_id" TO "vendor_business_id";--> statement-breakpoint
ALTER TABLE "portfolio_media" RENAME COLUMN "vendor_profile_id" TO "vendor_service_id";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "author_vendor_profile_id" TO "author_vendor_business_id";--> statement-breakpoint
ALTER TABLE "reviews" RENAME COLUMN "subject_vendor_profile_id" TO "subject_vendor_business_id";--> statement-breakpoint
ALTER TABLE "review_requests" RENAME COLUMN "subject_vendor_profile_id" TO "subject_vendor_business_id";--> statement-breakpoint
ALTER TABLE "saved_vendors" RENAME COLUMN "vendor_profile_id" TO "vendor_business_id";--> statement-breakpoint
ALTER TABLE "vendor_recommendations" RENAME COLUMN "vendor_profile_id" TO "vendor_business_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_wedding_vendor_uniq";--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_wedding_vendor_uniq";--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_author_subject_wedding_uniq";--> statement-breakpoint
ALTER TABLE "saved_vendors" DROP CONSTRAINT "saved_vendors_wedding_vendor_uniq";--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_uuid_unique";--> statement-breakpoint
ALTER TABLE "vendor_recommendations" DROP CONSTRAINT "vendor_recommendations_wedding_vendor_uniq";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_items" DROP CONSTRAINT "budget_items_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "portfolio_media" DROP CONSTRAINT "portfolio_media_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_author_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_subject_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "review_requests" DROP CONSTRAINT "review_requests_subject_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "saved_vendors" DROP CONSTRAINT "saved_vendors_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "service_packages" DROP CONSTRAINT "service_packages_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_vendor_account_id_vendor_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_logo_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP CONSTRAINT "vendor_profiles_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_recommendations" DROP CONSTRAINT "vendor_recommendations_vendor_profile_id_vendor_profiles_id_fk";
--> statement-breakpoint
DROP INDEX "bookings_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "budget_items_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "conversations_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "portfolio_media_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "review_requests_subject_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "saved_vendors_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "service_packages_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "vendor_profiles_vendor_account_id_idx";--> statement-breakpoint
DROP INDEX "vendor_profiles_category_id_idx";--> statement-breakpoint
DROP INDEX "vendor_profiles_region_idx";--> statement-breakpoint
DROP INDEX "vendor_profiles_is_published_idx";--> statement-breakpoint
DROP INDEX "vendor_recommendations_vendor_profile_id_idx";--> statement-breakpoint
DROP INDEX "reviews_subject_status_idx";--> statement-breakpoint
ALTER TABLE "service_packages" ADD COLUMN "vendor_service_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_services" ADD CONSTRAINT "vendor_services_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vendor_services_vendor_business_id_idx" ON "vendor_services" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "vendor_services_category_id_idx" ON "vendor_services" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "vendor_services_is_published_idx" ON "vendor_services" USING btree ("is_published");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_vendor_service_id_vendor_services_id_fk" FOREIGN KEY ("vendor_service_id") REFERENCES "public"."vendor_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("author_vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("subject_vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_subject_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("subject_vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_vendor_service_id_vendor_services_id_fk" FOREIGN KEY ("vendor_service_id") REFERENCES "public"."vendor_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_vendor_account_id_vendor_accounts_id_fk" FOREIGN KEY ("vendor_account_id") REFERENCES "public"."vendor_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_logo_file_id_files_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_vendor_business_id_vendor_businesses_id_fk" FOREIGN KEY ("vendor_business_id") REFERENCES "public"."vendor_businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_vendor_business_id_idx" ON "bookings" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "budget_items_vendor_business_id_idx" ON "budget_items" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "conversations_vendor_business_id_idx" ON "conversations" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "portfolio_media_vendor_service_id_idx" ON "portfolio_media" USING btree ("vendor_service_id");--> statement-breakpoint
CREATE INDEX "review_requests_subject_vendor_business_id_idx" ON "review_requests" USING btree ("subject_vendor_business_id");--> statement-breakpoint
CREATE INDEX "saved_vendors_vendor_business_id_idx" ON "saved_vendors" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "service_packages_vendor_service_id_idx" ON "service_packages" USING btree ("vendor_service_id");--> statement-breakpoint
CREATE INDEX "vendor_businesses_region_idx" ON "vendor_businesses" USING btree ("region");--> statement-breakpoint
CREATE INDEX "vendor_recommendations_vendor_business_id_idx" ON "vendor_recommendations" USING btree ("vendor_business_id");--> statement-breakpoint
CREATE INDEX "reviews_subject_status_idx" ON "reviews" USING btree ("subject_vendor_business_id","status");--> statement-breakpoint
ALTER TABLE "service_packages" DROP COLUMN "vendor_profile_id";--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "vendor_businesses" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_business_id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_business_id");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_subject_wedding_uniq" UNIQUE("author_user_id","subject_vendor_business_id","wedding_id");--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_business_id");--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_uuid_unique" UNIQUE("uuid");--> statement-breakpoint
ALTER TABLE "vendor_businesses" ADD CONSTRAINT "vendor_businesses_vendor_account_id_unique" UNIQUE("vendor_account_id");--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_business_id");