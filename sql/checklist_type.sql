DROP TABLE IF EXISTS `checklist_type`;
CREATE TABLE `checklist_type` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `type` ENUM("Mandatory","Document"),
    `checklistId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;