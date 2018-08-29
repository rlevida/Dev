DROP TABLE IF EXISTS `document`;
CREATE TABLE `document` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` TEXT,
    `origin` TEXT,
    `uploadedBy` BIGINT,
    `type` VARCHAR(20),
    `folderId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isDeleted` TINYINT(1) DEFAULT '0',
    `tags` TEXT,
    `status` ENUM("new","library","archived"),
    `isCompleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;