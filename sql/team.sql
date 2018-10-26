DROP TABLE IF EXISTS `team`;

CREATE TABLE `team` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `team` VARCHAR(50),
    `usersId` BIGINT,
    `teamLeaderId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;