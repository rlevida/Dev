DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `linkType` ENUM("project","workstream","task", "checklist", "document", "member"),
    `linkId` BIGINT,
    `actionType` ENUM("created","modified","deleted", "added"),
    `old` TEXT,
    `new` TEXT,
    `title` TEXT,
    `notes` TEXT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;