DROP TABLE IF EXISTS `activity_feed`;
CREATE TABLE `activity_feed` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `invokerUserId` BIGINT,
    `linkType` ENUM("project","workstream","task","conversation"),
    `linkId` BIGINT,
    `data` TEXT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;