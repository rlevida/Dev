DROP TABLE IF EXISTS `type`;
CREATE TABLE `type` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` VARCHAR(50),
    `uploadedBy` BIGINT,
    `type` VARCHAR(20),
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;