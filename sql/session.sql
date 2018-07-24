DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `session` VARCHAR(50),
    `usersId` bigint(20),
    `data` TEXT,
    `expiredDate` DATETIME,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;
