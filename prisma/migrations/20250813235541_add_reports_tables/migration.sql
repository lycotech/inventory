-- DropIndex
DROP INDEX `AlertLog_acknowledgedBy_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `AlertLog_inventoryId_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `ImportHistory_processedBy_fkey` ON `importhistory`;

-- DropIndex
DROP INDEX `Inventory_createdBy_fkey` ON `inventory`;

-- DropIndex
DROP INDEX `StockTransaction_inventoryId_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `StockTransaction_processedBy_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `UserSession_userId_fkey` ON `usersession`;

-- CreateTable
CREATE TABLE `Report` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportName` VARCHAR(191) NOT NULL,
    `reportType` ENUM('inventory', 'transaction', 'alert', 'custom') NOT NULL,
    `reportConfig` JSON NOT NULL,
    `createdBy` INTEGER NOT NULL,
    `isScheduled` BOOLEAN NOT NULL DEFAULT false,
    `scheduleFrequency` VARCHAR(191) NULL,
    `lastGenerated` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportExecution` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reportId` INTEGER NULL,
    `executionTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `parameters` JSON NULL,
    `filePath` VARCHAR(191) NULL,
    `status` ENUM('success', 'failed', 'processing') NOT NULL DEFAULT 'processing',
    `errorMessage` VARCHAR(191) NULL,
    `executedBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportHistory` ADD CONSTRAINT `ImportHistory_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertLog` ADD CONSTRAINT `AlertLog_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AlertLog` ADD CONSTRAINT `AlertLog_acknowledgedBy_fkey` FOREIGN KEY (`acknowledgedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSession` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportExecution` ADD CONSTRAINT `ReportExecution_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `Report`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportExecution` ADD CONSTRAINT `ReportExecution_executedBy_fkey` FOREIGN KEY (`executedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
