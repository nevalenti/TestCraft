-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TestCasePriority" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "TestRunStatus" AS ENUM ('Active', 'Completed', 'Archived');

-- CreateEnum
CREATE TYPE "TestResultStatus" AS ENUM ('Passed', 'Failed', 'Blocked', 'Skipped');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_suites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_suites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TestCasePriority" NOT NULL DEFAULT 'Medium',
    "suite_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_case_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expected_result" TEXT NOT NULL,
    "test_case_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_case_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" "TestRunStatus" NOT NULL DEFAULT 'Active',
    "executed_by_id" UUID,
    "project_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "TestResultStatus" NOT NULL,
    "notes" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL,
    "executed_by_id" UUID,
    "test_run_id" UUID NOT NULL,
    "test_case_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "test_suites_project_id_idx" ON "test_suites"("project_id");

-- CreateIndex
CREATE INDEX "test_cases_suite_id_idx" ON "test_cases"("suite_id");

-- CreateIndex
CREATE INDEX "test_cases_priority_idx" ON "test_cases"("priority");

-- CreateIndex
CREATE INDEX "test_case_steps_test_case_id_idx" ON "test_case_steps"("test_case_id");

-- CreateIndex
CREATE INDEX "test_runs_project_id_idx" ON "test_runs"("project_id");

-- CreateIndex
CREATE INDEX "test_results_test_run_id_idx" ON "test_results"("test_run_id");

-- CreateIndex
CREATE INDEX "test_results_status_idx" ON "test_results"("status");

-- CreateIndex
CREATE INDEX "test_results_executed_at_idx" ON "test_results"("executed_at");

-- AddForeignKey
ALTER TABLE "test_suites" ADD CONSTRAINT "test_suites_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cases" ADD CONSTRAINT "test_cases_suite_id_fkey" FOREIGN KEY ("suite_id") REFERENCES "test_suites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_case_steps" ADD CONSTRAINT "test_case_steps_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_test_case_id_fkey" FOREIGN KEY ("test_case_id") REFERENCES "test_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

