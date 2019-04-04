DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `firstName` VARCHAR(50),
    `lastName` VARCHAR(50),
    `phoneNumber` VARCHAR(20),
    `companyId` BIGINT,
    `username` VARCHAR(100),
    `password` VARCHAR(50),
    `salt` VARCHAR(50),
    `userType` ENUM("Internal","External"),
    `avatar` TEXT,
    `emailAddress` VARCHAR(100),
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    `company`VARCHAR(50),
    PRIMARY KEY(`id`)
) ENGINE=INNODB;
/* password : volenday */
INSERT INTO users (`username`,`firstName`,`lastName`,`password`,`emailAddress`,`salt`,`userType`,`avatar`,`dateAdded`)
values('admin','John Aldrin','Tapia','c08f94cdbfd13e47333a2d6e18c5ab8b6d2c3fbf','johnaldrin.tapia@volenday.com','4qVnChLYBUpVWuLXQsZBKQJcYiq5ZVRn',"Internal","https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png",NOW());
INSERT INTO users_notification_setting (`usersId`) values (1);
