ALTER TABLE "conversations" ADD COLUMN "is_pinned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "updated_at" timestamp DEFAULT now();