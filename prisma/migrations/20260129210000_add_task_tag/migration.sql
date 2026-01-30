-- AlterTable: adiciona coluna tag em Task (tema/fase da geração com IA)
ALTER TABLE `Task` ADD COLUMN `tag` VARCHAR(191) NULL;
