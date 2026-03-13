/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Purchase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PurchaseItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Purchase` DROP FOREIGN KEY `Purchase_userId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseItem` DROP FOREIGN KEY `PurchaseItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `PurchaseItem` DROP FOREIGN KEY `PurchaseItem_purchaseId_fkey`;

-- DropTable
DROP TABLE `Product`;

-- DropTable
DROP TABLE `Purchase`;

-- DropTable
DROP TABLE `PurchaseItem`;

-- CreateTable
CREATE TABLE `SavedAnalysis` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `jobId` CHAR(36) NOT NULL,
    `analysisType` VARCHAR(20) NOT NULL DEFAULT 'acoustic',
    `title` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `totalAudios` INTEGER NULL,
    `topAcousticRichness` DECIMAL(10, 6) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SavedAnalysis_jobId_key`(`jobId`),
    INDEX `SavedAnalysis_userId_createdAt_idx`(`userId`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalysisResult` (
    `id` CHAR(36) NOT NULL,
    `analysisId` CHAR(36) NOT NULL,
    `results` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AnalysisResult_analysisId_key`(`analysisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MicroResult` (
    `id` CHAR(36) NOT NULL,
    `analysisId` CHAR(36) NOT NULL,
    `microJobId` CHAR(36) NOT NULL,
    `results` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MicroResult_analysisId_idx`(`analysisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SavedAnalysis` ADD CONSTRAINT `SavedAnalysis_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnalysisResult` ADD CONSTRAINT `AnalysisResult_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `SavedAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MicroResult` ADD CONSTRAINT `MicroResult_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `SavedAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
