CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."content_source" AS ENUM('generated', 'manual', 'booking');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('flat', 'hourly', 'per_guest');--> statement-breakpoint
CREATE TYPE "public"."recommendation_status" AS ENUM('suggested', 'accepted', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."review_request_status" AS ENUM('sent', 'completed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'rejected', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."review_type" AS ENUM('peer', 'client');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."wedding_status" AS ENUM('planning', 'complete');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"service_package_id" integer,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"booked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "bookings_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "bookings_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_profile_id")
);
--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"category" text NOT NULL,
	"label" text NOT NULL,
	"estimated_cents" integer,
	"actual_cents" integer,
	"vendor_profile_id" integer,
	"service_package_id" integer,
	"source" "content_source" DEFAULT 'manual' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "budget_items_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"due_date" timestamp with time zone,
	"is_complete" boolean DEFAULT false NOT NULL,
	"source" "content_source" DEFAULT 'manual' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "checklist_items_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"last_read_at" timestamp with time zone,
	CONSTRAINT "conversation_participants_conversation_user_uniq" UNIQUE("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"last_message_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "conversations_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "conversations_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_profile_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_user_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "messages_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"action_url" text,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "portfolio_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"file_id" integer NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "portfolio_media_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"review_request_id" integer,
	"type" "review_type" NOT NULL,
	"author_user_id" integer NOT NULL,
	"author_vendor_profile_id" integer,
	"subject_vendor_profile_id" integer NOT NULL,
	"wedding_id" integer NOT NULL,
	"overall_rating" integer NOT NULL,
	"ratings" jsonb,
	"body" text,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "reviews_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "reviews_author_subject_wedding_uniq" UNIQUE("author_user_id","subject_vendor_profile_id","wedding_id"),
	CONSTRAINT "reviews_overall_rating_chk" CHECK ("reviews"."overall_rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"subject_vendor_profile_id" integer NOT NULL,
	"target_user_id" integer NOT NULL,
	"type" "review_type" NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" "review_request_status" DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "review_requests_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "review_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "saved_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"notes" text,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "saved_vendors_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "saved_vendors_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_profile_id")
);
--> statement-breakpoint
CREATE TABLE "service_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"price_unit" "price_unit" DEFAULT 'flat' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "service_packages_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"stripe_event_id" text NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vendor_account_id" integer NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"tier" "subscription_tier" NOT NULL,
	"status" "subscription_status" NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "subscriptions_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "subscriptions_vendor_account_id_unique" UNIQUE("vendor_account_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vendor_accounts_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "vendor_accounts_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "vendor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"vendor_account_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"business_name" text NOT NULL,
	"tagline" text,
	"bio" text,
	"logo_file_id" integer,
	"website" text,
	"city" text,
	"region" text,
	"years_in_business" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vendor_profiles_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "vendor_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" integer NOT NULL,
	"vendor_profile_id" integer NOT NULL,
	"match_score" integer,
	"rationale" text,
	"status" "recommendation_status" DEFAULT 'suggested' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "vendor_recommendations_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "vendor_recommendations_wedding_vendor_uniq" UNIQUE("wedding_id","vendor_profile_id")
);
--> statement-breakpoint
CREATE TABLE "weddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" integer NOT NULL,
	"partner_user_id" integer,
	"wedding_date" timestamp with time zone,
	"estimated_budget_cents" integer,
	"guest_count_estimate" integer,
	"city" text,
	"region" text,
	"style_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"style_palette" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"onboarding_answers" jsonb,
	"status" "wedding_status" DEFAULT 'planning' NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "weddings_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "weddings_owner_user_id_uniq" UNIQUE("owner_user_id")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_service_package_id_service_packages_id_fk" FOREIGN KEY ("service_package_id") REFERENCES "public"."service_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_media" ADD CONSTRAINT "portfolio_media_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_review_request_id_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."review_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("author_vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("subject_vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_subject_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("subject_vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_vendors" ADD CONSTRAINT "saved_vendors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vendor_account_id_vendor_accounts_id_fk" FOREIGN KEY ("vendor_account_id") REFERENCES "public"."vendor_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_accounts" ADD CONSTRAINT "vendor_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_accounts" ADD CONSTRAINT "vendor_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_accounts" ADD CONSTRAINT "vendor_accounts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_vendor_account_id_vendor_accounts_id_fk" FOREIGN KEY ("vendor_account_id") REFERENCES "public"."vendor_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_logo_file_id_files_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_vendor_profile_id_vendor_profiles_id_fk" FOREIGN KEY ("vendor_profile_id") REFERENCES "public"."vendor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_recommendations" ADD CONSTRAINT "vendor_recommendations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_partner_user_id_users_id_fk" FOREIGN KEY ("partner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bookings_wedding_id_idx" ON "bookings" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "bookings_vendor_profile_id_idx" ON "bookings" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "budget_items_wedding_id_idx" ON "budget_items" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "budget_items_vendor_profile_id_idx" ON "budget_items" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "checklist_items_wedding_id_idx" ON "checklist_items" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "conversation_participants_user_id_idx" ON "conversation_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_wedding_id_idx" ON "conversations" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "conversations_vendor_profile_id_idx" ON "conversations" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_user_id_idx" ON "messages" USING btree ("sender_user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "portfolio_media_vendor_profile_id_idx" ON "portfolio_media" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "portfolio_media_file_id_idx" ON "portfolio_media" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "reviews_subject_status_idx" ON "reviews" USING btree ("subject_vendor_profile_id","status");--> statement-breakpoint
CREATE INDEX "review_requests_target_user_id_idx" ON "review_requests" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "review_requests_subject_vendor_profile_id_idx" ON "review_requests" USING btree ("subject_vendor_profile_id");--> statement-breakpoint
CREATE INDEX "review_requests_wedding_id_idx" ON "review_requests" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "saved_vendors_wedding_id_idx" ON "saved_vendors" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "saved_vendors_vendor_profile_id_idx" ON "saved_vendors" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "service_packages_vendor_profile_id_idx" ON "service_packages" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "vendor_profiles_vendor_account_id_idx" ON "vendor_profiles" USING btree ("vendor_account_id");--> statement-breakpoint
CREATE INDEX "vendor_profiles_category_id_idx" ON "vendor_profiles" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "vendor_profiles_region_idx" ON "vendor_profiles" USING btree ("region");--> statement-breakpoint
CREATE INDEX "vendor_profiles_is_published_idx" ON "vendor_profiles" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "vendor_recommendations_wedding_id_idx" ON "vendor_recommendations" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "vendor_recommendations_vendor_profile_id_idx" ON "vendor_recommendations" USING btree ("vendor_profile_id");--> statement-breakpoint
CREATE INDEX "weddings_partner_user_id_idx" ON "weddings" USING btree ("partner_user_id");--> statement-breakpoint
CREATE INDEX "weddings_wedding_date_idx" ON "weddings" USING btree ("wedding_date");