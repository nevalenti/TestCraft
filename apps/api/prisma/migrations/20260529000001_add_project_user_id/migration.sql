-- AlterTable: add user_id with a sentinel default so existing rows get a value
ALTER TABLE "projects" ADD COLUMN "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Drop the default — future inserts must supply user_id explicitly
ALTER TABLE "projects" ALTER COLUMN "user_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
