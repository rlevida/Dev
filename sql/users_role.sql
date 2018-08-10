DROP TABLE IF EXISTS `users_role`;

CREATE TABLE `users_role` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersId` BIGINT,
    `roleId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;

INSERT INTO `cloud_cfo`.`users_role`(`usersId`,`roleId`,`dateAdded`) VALUES ('1','1',NOW());