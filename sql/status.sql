DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `status` VARCHAR(50),
    `linkType` ENUM("project","workstream","task"),
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;

INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Active', 'project',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('On-track', 'project',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Issues', 'project',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Active', 'workstream',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('On-time', 'workstream',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Inactive', 'workstream',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Issues', 'workstream',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Active', 'task',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Inactive', 'task',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Due Today', 'task',NOW());
INSERT INTO `cloud_cfo`.`status`(`status`, `linkType`, `dateAdded`) VALUES ('Issues', 'task',NOW());