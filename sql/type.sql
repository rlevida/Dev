DROP TABLE IF EXISTS `type`;
CREATE TABLE `type` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `type` VARCHAR(30),
    `linkType` ENUM("project","workstream","task"),
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;

ALTER TABLE  `type` CHANGE  `type`  `type` VARCHAR( 30 ) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL 

INSERT INTO `cloud_cfo`.`type`(`type`, `linkType`, `dateAdded`) VALUES ('Client', 'project', NOW());
INSERT INTO `cloud_cfo`.`type`(`type`, `linkType`, `dateAdded`) VALUES ('Internal', 'project', NOW());
INSERT INTO `cloud_cfo`.`type`(`type`, `linkType`, `dateAdded`) VALUES ('Project - Output base
', 'workstream', NOW());
INSERT INTO `cloud_cfo`.`type`(`type`, `linkType`, `dateAdded`) VALUES ('External', 'project', NOW());
INSERT INTO `cloud_cfo`.`type`(`type`, `linkType`, `dateAdded`) VALUES ('Time based', 'workstream', NOW());