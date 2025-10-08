-- DropIndex
DROP INDEX `AlertLog_acknowledgedBy_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `AlertLog_inventoryId_fkey` ON `alertlog`;

-- DropIndex
DROP INDEX `Batch_createdBy_fkey` ON `batch`;

-- DropIndex
DROP INDEX `BatchAlert_acknowledgedBy_fkey` ON `batchalert`;

-- DropIndex
DROP INDEX `BatchTransaction_fromWarehouseId_fkey` ON `batchtransaction`;

-- DropIndex
DROP INDEX `BatchTransaction_processedBy_fkey` ON `batchtransaction`;

-- DropIndex
DROP INDEX `BatchTransaction_toWarehouseId_fkey` ON `batchtransaction`;

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

-- CreateTable
CREATE TABLE `user_menu_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `menuItem` ENUM('dashboard', 'inventory', 'batches', 'alerts', 'reports', 'users', 'settings', 'backup', 'logs', 'warehouse_transfer', 'stock_aging', 'import') NOT NULL,
    `canAccess` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_menu_permissions_userId_menuItem_key`(`userId`, `menuItem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_warehouse_access` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `warehouseName` VARCHAR(191) NOT NULL,
    `canView` BOOLEAN NOT NULL DEFAULT false,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `canTransfer` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_warehouse_access_userId_warehouseName_key`(`userId`, `warehouseName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_operation_privileges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `operation` ENUM('create', 'read', 'update', 'delete', 'import', 'export', 'transfer', 'adjust_stock', 'reset_stock', 'acknowledge_alerts') NOT NULL,
    `hasAccess` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_operation_privileges_userId_operation_key`(`userId`, `operation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_menu_permissions` ADD CONSTRAINT `user_menu_permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_warehouse_access` ADD CONSTRAINT `user_warehouse_access_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_operation_privileges` ADD CONSTRAINT `user_operation_privileges_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
