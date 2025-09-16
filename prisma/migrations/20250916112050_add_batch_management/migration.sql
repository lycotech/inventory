-- DropIndex
DROP INDEX `AlertLog_acknowledgedBy_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `AlertLog_inventoryId_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `ImportHistory_processedBy_fkey` ON `importhistory`;

-- DropIndex
DROP INDEX `Inventory_createdBy_fkey` ON `inventory`;

-- DropIndex
DROP INDEX `Report_createdBy_fkey` ON `report`;

-- DropIndex
DROP INDEX `ReportExecution_executedBy_fkey` ON `reportexecution`;

-- DropIndex
DROP INDEX `ReportExecution_reportId_fkey` ON `reportexecution`;

-- DropIndex
DROP INDEX `StockTransaction_fromWarehouseId_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `StockTransaction_inventoryId_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `StockTransaction_processedBy_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `StockTransaction_toWarehouseId_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `UserSession_userId_fkey` ON `usersession`;

-- AlterTable
ALTER TABLE `importhistory` MODIFY `importType` ENUM('full', 'stock_receive', 'stock_transfer', 'stock_alert', 'adjustment', 'stock_out') NOT NULL;

-- AlterTable
ALTER TABLE `stocktransaction` MODIFY `transactionType` ENUM('receive', 'issue', 'adjustment', 'transfer', 'stock_out') NOT NULL;

-- CreateTable
CREATE TABLE `Batch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchNumber` VARCHAR(100) NOT NULL,
    `inventoryId` INTEGER NOT NULL,
    `warehouseId` INTEGER NOT NULL,
    `quantityReceived` INTEGER NOT NULL,
    `quantityRemaining` INTEGER NOT NULL,
    `manufactureDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NOT NULL,
    `supplierInfo` VARCHAR(255) NULL,
    `lotNumber` VARCHAR(100) NULL,
    `costPerUnit` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Batch_batchNumber_key`(`batchNumber`),
    INDEX `Batch_inventoryId_idx`(`inventoryId`),
    INDEX `Batch_warehouseId_idx`(`warehouseId`),
    INDEX `Batch_expiryDate_idx`(`expiryDate`),
    INDEX `Batch_batchNumber_idx`(`batchNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `transactionType` ENUM('receive', 'issue', 'adjustment', 'transfer', 'stock_out') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `transactionDate` DATETIME(3) NOT NULL,
    `referenceDoc` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `processedBy` INTEGER NOT NULL,
    `fromWarehouseId` INTEGER NULL,
    `toWarehouseId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BatchTransaction_batchId_idx`(`batchId`),
    INDEX `BatchTransaction_transactionDate_idx`(`transactionDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BatchAlert` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchId` INTEGER NOT NULL,
    `alertType` ENUM('expiring_soon', 'expired', 'low_quantity') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `priorityLevel` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    `acknowledged` BOOLEAN NOT NULL DEFAULT false,
    `acknowledgedBy` INTEGER NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BatchAlert_batchId_idx`(`batchId`),
    INDEX `BatchAlert_alertType_idx`(`alertType`),
    INDEX `BatchAlert_acknowledged_idx`(`acknowledged`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockTransaction` ADD CONSTRAINT `StockTransaction_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAging` ADD CONSTRAINT `StockAging_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockAging` ADD CONSTRAINT `StockAging_agingCategoryId_fkey` FOREIGN KEY (`agingCategoryId`) REFERENCES `AgingCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Batch` ADD CONSTRAINT `Batch_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchTransaction` ADD CONSTRAINT `BatchTransaction_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchTransaction` ADD CONSTRAINT `BatchTransaction_processedBy_fkey` FOREIGN KEY (`processedBy`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchTransaction` ADD CONSTRAINT `BatchTransaction_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchTransaction` ADD CONSTRAINT `BatchTransaction_toWarehouseId_fkey` FOREIGN KEY (`toWarehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchAlert` ADD CONSTRAINT `BatchAlert_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `Batch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BatchAlert` ADD CONSTRAINT `BatchAlert_acknowledgedBy_fkey` FOREIGN KEY (`acknowledgedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
