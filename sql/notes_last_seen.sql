DROP TABLE IF EXISTS `notes_last_seen`;
CREATE TABLE `notes_last_seen` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `linkType` ENUM("notes","conversation"),
    `linkId` BIGINT,
    `userId` BIGINT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;