DROP TABLE IF EXISTS `document`;
CREATE TABLE `document` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` TEXT,
    `origin` TEXT,
    `uploadedBy` BIGINT,
    `type` VARCHAR(20),
    `folderId` BIGINT,
    `isDeleted` TINYINT(1) DEFAULT '0',
    `tags` TEXT,
    `status` ENUM("new","library","archived"),
    `isCompleted` TINYINT(1) DEFAULT '0',
    `documentNameCount` INT(11) NOT NULL DEFAULT '0',
    `attachmentId` INT(11) NOT NULL DEFAULT '0',
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;