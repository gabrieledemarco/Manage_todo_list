ALTER TABLE "Activity" ADD COLUMN "startedAt" DATETIME;
ALTER TABLE "Task" ADD COLUMN "reminder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "reminderDays" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "ActivityDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    CONSTRAINT "ActivityDependency_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityDependency_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ActivityDependency_activityId_prerequisiteId_key" ON "ActivityDependency"("activityId", "prerequisiteId");

CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TaskDependency_taskId_prerequisiteId_key" ON "TaskDependency"("taskId", "prerequisiteId");
