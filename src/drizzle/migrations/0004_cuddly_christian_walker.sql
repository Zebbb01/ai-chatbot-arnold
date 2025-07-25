ALTER TABLE "schedules" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "invitees" jsonb;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "updated_at" timestamp DEFAULT now();