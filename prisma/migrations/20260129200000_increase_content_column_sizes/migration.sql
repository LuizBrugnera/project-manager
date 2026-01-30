-- AlterTable: aumentar tamanho de colunas de conteúdo para suportar texto longo
-- (contexto, escopo, papéis, definição, tasks, etc.)

ALTER TABLE `Project` MODIFY COLUMN `description` TEXT NULL;

ALTER TABLE `ProjectSection` MODIFY COLUMN `content` LONGTEXT NOT NULL;
ALTER TABLE `ProjectSection` MODIFY COLUMN `externalLinks` TEXT NULL;

ALTER TABLE `ContentVersion` MODIFY COLUMN `content` LONGTEXT NOT NULL;

ALTER TABLE `Task` MODIFY COLUMN `title` VARCHAR(500) NOT NULL;
ALTER TABLE `Task` MODIFY COLUMN `description` TEXT NULL;

ALTER TABLE `ActivityLog` MODIFY COLUMN `action` VARCHAR(500) NULL;
ALTER TABLE `ActivityLog` MODIFY COLUMN `message` TEXT NOT NULL;

ALTER TABLE `ProjectMilestone` MODIFY COLUMN `title` VARCHAR(500) NOT NULL;
ALTER TABLE `ProjectMilestone` MODIFY COLUMN `description` TEXT NULL;
