/*
  Warnings:

  - Added the required column `contactInfo` to the `Resume` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skills` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "achievements" JSONB[],
ADD COLUMN     "contactInfo" JSONB NOT NULL,
ADD COLUMN     "education" JSONB[],
ADD COLUMN     "experience" JSONB[],
ADD COLUMN     "projects" JSONB[],
ADD COLUMN     "skills" TEXT NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;
