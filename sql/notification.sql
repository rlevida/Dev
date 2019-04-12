DROP TABLE IF EXISTS `notification`;
CREATE TABLE `notification` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `projectId` BIGINT,
    `workstreamId` BIGINT,
    `taskId` BIGINT,
    `documentId` BIGINT,
    `noteId` BIGINT,
    `message` VARCHAR(255),
    `isActive` TINYINT DEFAULT '1',
    `isRead` TINYINT DEFAULT '0',
    `isArchived` TINYINT DEFAULT '0',
    `type` ENUM("taskAssigned","taskApprover","taskTagged","fileNewUpload","messageSend","commentReplies","taskDeadline","taskMemberCompleted","taskFollowingCompleted","taskTeamDeadline","taskFollowingDeadline"),
    `createdBy` BIGINT,
    `isDeleted` TINYINT DEFAULT '0',
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;
