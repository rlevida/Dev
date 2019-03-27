DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `indicator` VARCHAR(50),
    `linkType` ENUM("user","workstream","task","conversation","document","others","notes"),
    `linkId` BIGINT,
    `tagType` ENUM("user","workstream","task","conversation","document","folder","notes"),
    `tagTypeId` BIGINT,
    `isDeleted` TINYINT(1) DEFAULT '0',
    `isCompleted` TINYINT(1) DEFAULT '0',
    `dateAdded` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;