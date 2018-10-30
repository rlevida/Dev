DROP TABLE IF EXISTS `checklist_documents`;
CREATE TABLE `checklist_documents` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `taskId` BIGINT,
    `documentId` BIGINT,
    `checklistId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;