ALTER TABLE "checklist_items" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_items_category_id_idx" ON "checklist_items" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "checklist_items" DROP COLUMN "category";