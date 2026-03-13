-- CreateTable
CREATE TABLE `Article` (
    `id` CHAR(36) NOT NULL,
    `authorId` CHAR(36) NOT NULL,
    `analysisId` CHAR(36) NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `published` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Article_authorId_idx`(`authorId`),
    INDEX `Article_analysisId_idx`(`analysisId`),
    INDEX `Article_published_createdAt_idx`(`published`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `SavedAnalysis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
