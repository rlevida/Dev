DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `status` VARCHAR(50),
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;