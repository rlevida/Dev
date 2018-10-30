DROP TABLE IF EXISTS `starred`;
CREATE TABLE `starred` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `linkType` ENUM("project","workstream","task","document","conversation"),
    `linkId` BIGINT,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    `dateAdded` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;