-- AlterTable
ALTER TABLE `candidate` ADD COLUMN `joiningStatus` VARCHAR(191) NULL,
    ADD COLUMN `ownerName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `contacts` JSON NULL;
