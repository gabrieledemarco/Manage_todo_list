-- Add docPath to all models
ALTER TABLE "Project"  ADD COLUMN "docPath" TEXT;
ALTER TABLE "Category" ADD COLUMN "docPath" TEXT;
ALTER TABLE "Activity" ADD COLUMN "docPath" TEXT;
ALTER TABLE "Task"     ADD COLUMN "docPath" TEXT;
