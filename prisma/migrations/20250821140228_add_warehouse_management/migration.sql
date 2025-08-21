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
DROP INDEX `StockTransaction_inventoryId_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `StockTransaction_processedBy_fkey` ON `stocktransaction`;

-- DropIndex
DROP INDEX `UserSession_userId_fkey` ON `usersession`;

-- AlterTable
ALTER TABLE `importhistory` MODIFY `importType` ENUM('full', 'stock_receive', 'stock_issue', 'adjustment', 'warehouse_transfer') NOT NULL;

-- AlterTable
ALTER TABLE `stocktransaction` ADD COLUMN `fromWarehouseId` INTEGER NULL,
    ADD COLUMN `toWarehouseId` INTEGER NULL,
    MODIFY `transactionType` ENUM('receive', 'issue', 'adjustment', 'transfer') NOT NULL;

-- CreateTable
CREATE TABLE `Warehouse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouseName` VARCHAR(191) NOT NULL,
    `warehouseCode` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `contactPerson` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `isCentralWarehouse` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Warehouse_warehouseName_key`(`warehouseName`),
    UNIQUE INDEX `Warehouse_warehouseCode_key`(`warehouseCode`),
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
