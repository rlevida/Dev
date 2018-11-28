DROP TABLE IF EXISTS `activity_logs_document`;
CREATE TABLE `activity_logs_document` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `linkType` ENUM("project","workstream","task", "checklist", "document", "member"),
    `linkId` BIGINT,
    `projectId` BIGINT,
    `actionType` ENUM("created","modified","deleted", "added","moved","shared",'starred','duplicated'),
    `old` TEXT,
    `new` TEXT,
    `title` TEXT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;