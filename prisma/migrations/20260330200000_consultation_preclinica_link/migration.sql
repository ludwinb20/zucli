-- AlterTable
ALTER TABLE `consultations` ADD COLUMN `preclinicaId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `consultations_preclinicaId_key` ON `consultations`(`preclinicaId`);

-- AddForeignKey
ALTER TABLE `consultations` ADD CONSTRAINT `consultations_preclinicaId_fkey` FOREIGN KEY (`preclinicaId`) REFERENCES `preclinicas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
