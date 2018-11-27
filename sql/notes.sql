DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `note` VARCHAR(255),
    `privacyType` VARCHAR(20),
    `isStarred` TINYINT,
    `createdBy` BIGINT,
    `isClosed` TINYINT,
    `projectId` BIGINT,
    `specificClient` TEXT,
    `accessType` VARCHAR(30),
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;