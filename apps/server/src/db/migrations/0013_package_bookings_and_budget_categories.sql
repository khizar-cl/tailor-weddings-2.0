ALTER TABLE "bookings" DROP CONSTRAINT "bookings_wedding_service_uniq";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_vendor_service_id_vendor_services_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_items" DROP CONSTRAINT "budget_items_vendor_service_id_vendor_services_id_fk";
--> statement-breakpoint
DROP INDEX "bookings_vendor_service_id_idx";--> statement-breakpoint
DROP INDEX "budget_items_vendor_service_id_idx";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "service_package_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "custom_category" text;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_service_package_id_idx" ON "bookings" USING btree ("service_package_id");--> statement-breakpoint
CREATE INDEX "budget_items_category_id_idx" ON "budget_items" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "vendor_service_id";--> statement-breakpoint
ALTER TABLE "budget_items" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "budget_items" DROP COLUMN "vendor_service_id";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_wedding_package_uniq" UNIQUE("wedding_id","service_package_id");--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_category_xor_custom_chk" CHECK (("budget_items"."category_id" is not null) <> ("budget_items"."custom_category" is not null));