DROP TABLE IF EXISTS `role`;

CREATE TABLE `role` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `roleType` ENUM("Internal","External"),
    `role` VARCHAR(50),
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;

INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('Internal','Master Admin',NOW());
INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('Internal','Admin',NOW());
INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('Internal','Manager',NOW());
INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('Internal','Standard User',NOW());
INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('External','Manager Guest',NOW());
INSERT INTO `cloud_cfo`.`role`(`roleType`,`role`,`dateAdded`) VALUES ('External','User Guest',NOW());