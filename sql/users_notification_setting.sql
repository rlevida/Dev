DROP TABLE IF EXISTS `users_notification_setting`;

CREATE TABLE `users_notification_setting`
(
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `taskAssigned` TINYINT
(1) DEFAULT '1',
    `taskAssignedComment` TINYINT
(1) DEFAULT '1',
    `taskApprover`TINYINT
(1) DEFAULT '1',
    `taskTagged` TINYINT
(1) DEFAULT '1',   
    `fileNewUpload` TINYINT
(1) DEFAULT '1',   
    `messageSend` TINYINT
(1) DEFAULT '1',
    `commentReplies` TINYINT
(1) DEFAULT '1',  
    `taskDeadline` TINYINT
(1) DEFAULT '1',
    `taskMemberCompleted` TINYINT
(1) DEFAULT '1',  
    `taskFollowingCompleted` TINYINT
(1) DEFAULT '1',  
    `taskTeamDeadline` TINYINT
(1) DEFAULT '1',  
    `taskFollowingDeadline` TINYINT
(1) DEFAULT '1',
    `taskBeforeDeadline` TINYINT
(1) DEFAULT '1',
    `receiveEmail` TINYINT
(1) DEFAULT '1',  
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON
UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY
(`id`)
) ENGINE=INNODB;
