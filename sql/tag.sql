DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `indicator` VARCHAR(50),
    `linkType` ENUM("user","workstream","task","conversation","document","others"),
    `linkId` BIGINT,
    `tagType` ENUM("user","workstream","task","conversation","document"),
    `tagTypeId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;