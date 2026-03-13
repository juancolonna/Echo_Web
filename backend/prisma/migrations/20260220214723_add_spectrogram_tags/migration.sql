-- CreateTable
CREATE TABLE `SpectrogramTag` (
    `id` CHAR(36) NOT NULL,
    `analysisId` CHAR(36) NOT NULL,
    `audioFilename` VARCHAR(255) NOT NULL,
    `startTime` DOUBLE NOT NULL,
    `endTime` DOUBLE NOT NULL,
    `minFreqHz` DOUBLE NOT NULL,
    `maxFreqHz` DOUBLE NOT NULL,
    `species` VARCHAR(255) NOT NULL DEFAULT '',
    `numIndividuals` INTEGER NOT NULL DEFAULT 1,
    `type` VARCHAR(20) NOT NULL DEFAULT 'Unknown',
    `comments` TEXT NULL,
    `color` VARCHAR(20) NOT NULL DEFAULT '#f472b6',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SpectrogramTag_analysisId_idx`(`analysisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SpectrogramTag` ADD CONSTRAINT `SpectrogramTag_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `SavedAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
