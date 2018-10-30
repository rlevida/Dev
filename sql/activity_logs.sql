DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `actionType` ENUM("created","modified","deleted"),
    `old` TEXT,
    `new` TEXT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;