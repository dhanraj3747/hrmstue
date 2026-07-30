-- AlterTable
ALTER TABLE `payslip` ADD COLUMN `subDepartment` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `job_opening` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NULL,
    `vendorId` INTEGER NULL,
    `process` VARCHAR(191) NULL,
    `skills` VARCHAR(191) NULL,
    `languages` VARCHAR(191) NULL,
    `salary` VARCHAR(191) NULL,
    `ctc` VARCHAR(191) NULL,
    `takeHome` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `jd` TEXT NULL,
    `clauseDays` INTEGER NOT NULL DEFAULT 45,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
