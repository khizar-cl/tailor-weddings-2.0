ALTER TABLE "bookings" DROP CONSTRAINT "bookings_wedding_vendor_uniq";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "vendor_service_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "budget_items" ADD COLUMN "vendor_service_id" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_service_id_vendor_services_id_fk" FOREIGN KEY ("vendor_service_id") REFERENCES "public"."vendor_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_vendor_service_id_vendor_services_id_fk" FOREIGN KEY ("vendor_service_id") REFERENCES "public"."vendor_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_vendor_service_id_idx" ON "bookings" USING btree ("vendor_service_id");--> statement-breakpoint
CREATE INDEX "budget_items_vendor_service_id_idx" ON "budget_items" USING btree ("vendor_service_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_wedding_service_uniq" UNIQUE("wedding_id","vendor_service_id");