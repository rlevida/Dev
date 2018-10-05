DROP TABLE IF EXISTS `activity_feed`;
CREATE TABLE IF NOT EXISTS `activity_feed` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invokerUserId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `data` text COLLATE utf8mb4_bin,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `activity_log`;
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `invokerUserId` bigint(20) DEFAULT NULL,
  `data` text COLLATE utf8mb4_bin,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `company`;
CREATE TABLE IF NOT EXISTS `company` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `companyName` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `industry` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `conversation`;
CREATE TABLE IF NOT EXISTS `conversation` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `comment` text COLLATE utf8mb4_bin,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `status` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `document`;
CREATE TABLE IF NOT EXISTS `document` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` text,
  `origin` text,
  `uploadedBy` bigint(20) DEFAULT NULL,
  `type` varchar(20) DEFAULT NULL,
  `folderId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `tags` text,
  `status` enum('new','library','archived') DEFAULT NULL,
  `isCompleted` tinyint(1) DEFAULT '0',
  `documentNameCount` int(11) NOT NULL DEFAULT '0',
  `attachmentId` int(11) NOT NULL DEFAULT '0',
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `document_link`;
CREATE TABLE IF NOT EXISTS `document_link` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `documentId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=108 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `folder`;
CREATE TABLE IF NOT EXISTS `folder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` text COLLATE utf8mb4_bin,
  `projectId` bigint(20) DEFAULT NULL,
  `parentId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  `isFolder` tinyint(1) DEFAULT '1',
  `type` enum('new','library','archived') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `ip_block`;
CREATE TABLE IF NOT EXISTS `ip_block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ipAddress` varchar(30) COLLATE utf8mb4_bin DEFAULT NULL,
  `failedTimes` int(2) DEFAULT NULL,
  `dateFailed` datetime DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `members`;
CREATE TABLE IF NOT EXISTS `members` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersType` enum('users','team') DEFAULT NULL,
  `userTypeLinkId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task') DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `memberType` enum('assignedTo','Follower','responsible','project manager') DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=220 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `project`;
CREATE TABLE IF NOT EXISTS `project` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project` varchar(50) DEFAULT NULL,
  `statusId` bigint(20) DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `projectType` varchar(50) DEFAULT NULL,
  `tinNo` varchar(50) DEFAULT NULL,
  `companyAddress` varchar(50) DEFAULT NULL,
  `classification` varchar(50) DEFAULT NULL,
  `projectNameCount` int(11) NOT NULL DEFAULT '0',
  `createdBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `reminder`;
CREATE TABLE IF NOT EXISTS `reminder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reminderDetail` varchar(50) DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `taskId` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT '0',
  `projectId` bigint(20) DEFAULT NULL,
  `reminderTypeId` bigint(20) DEFAULT NULL,
  `reminderType` enum('task','document') DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `role`;
CREATE TABLE IF NOT EXISTS `role` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `roleType` enum('Internal','External') COLLATE utf8mb4_bin DEFAULT NULL,
  `role` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `session`;
CREATE TABLE IF NOT EXISTS `session` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `data` text COLLATE utf8mb4_bin,
  `expiredDate` datetime DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `share`;
CREATE TABLE IF NOT EXISTS `share` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersType` enum('users','team') COLLATE utf8mb4_bin DEFAULT NULL,
  `userTypeLinkId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `shareType` enum('document','folder') COLLATE utf8mb4_bin DEFAULT NULL,
  `shareId` bigint(20) DEFAULT NULL,
  `sharedBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `starred`;
CREATE TABLE IF NOT EXISTS `starred` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','document','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `status`;
CREATE TABLE IF NOT EXISTS `status` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `status` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `linkType` enum('project','workstream','task') COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `tag`;
CREATE TABLE IF NOT EXISTS `tag` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `indicator` varchar(50) DEFAULT NULL,
  `linkType` enum('user','workstream','task','conversation','document','others','checklist') DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `tagType` enum('user','workstream','task','conversation','document','folder','checklist') DEFAULT NULL,
  `tagTypeId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isCompleted` int(11) NOT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task`;
CREATE TABLE IF NOT EXISTS `task` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `task` text,
  `description` text,
  `workstreamId` bigint(20) DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `status` enum('In Progress','For Approval','Completed') DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `linkTaskId` bigint(20) DEFAULT NULL,
  `periodic` tinyint(1) DEFAULT '0',
  `periodType` enum('years','months','weeks','days') DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  `periodInstance` int(11) DEFAULT '0',
  `periodTask` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task_checklist`;
CREATE TABLE IF NOT EXISTS `task_checklist` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `completed` tinyint(1) DEFAULT '0',
  `description` text,
  `taskId` bigint(20) DEFAULT NULL,
  `periodChecklist` bigint(20) DEFAULT NULL,
  `documents` varchar(50) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task_dependency`;
CREATE TABLE IF NOT EXISTS `task_dependency` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` bigint(20) DEFAULT NULL,
  `dependencyType` enum('Preceded by','Succeeding') DEFAULT NULL,
  `linkTaskId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `team`;
CREATE TABLE IF NOT EXISTS `team` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `teamLeaderId` int(11) NOT NULL,
  `usersId` bigint(20) NOT NULL,
  `team` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `type`;
CREATE TABLE IF NOT EXISTS `type` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(30) COLLATE utf8mb4_bin DEFAULT NULL,
  `linkType` enum('project','workstream','task') COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `lastName` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `phoneNumber` varchar(20) COLLATE utf8mb4_bin DEFAULT NULL,
  `companyId` bigint(20) DEFAULT NULL,
  `username` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `password` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `salt` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `userType` enum('Internal','External') COLLATE utf8mb4_bin DEFAULT NULL,
  `avatar` text COLLATE utf8mb4_bin,
  `emailAddress` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `company` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_forgot_password`;
CREATE TABLE IF NOT EXISTS `users_forgot_password` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `hash` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_role`;
CREATE TABLE IF NOT EXISTS `users_role` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `roleId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=97 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_team`;
CREATE TABLE IF NOT EXISTS `users_team` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `teamId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `workstream`;
CREATE TABLE IF NOT EXISTS `workstream` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `workstream` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `projectName` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `projectDescription` text COLLATE utf8mb4_bin,
  `numberOfHours` bigint(20) DEFAULT NULL,
  `statusId` bigint(20) DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;


INSERT INTO `conversation` (`id`,`comment`,`usersId`,`linkType`,`linkId`,`status`,`dateAdded`,`dateUpdated`,`isDeleted`) VALUES (1,'{[Ivan Pintor](11)} \nWhy do we use it?\nIt is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using \'Content here, content here\', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for \'lorem ipsum\' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).',6,'task',1,NULL,'2018-09-21 16:09:17.000','2018-09-21 16:09:17.000',0);
INSERT INTO `conversation` (`id`,`comment`,`usersId`,`linkType`,`linkId`,`status`,`dateAdded`,`dateUpdated`,`isDeleted`) VALUES (2,'{[John Aldrin1 Tapia1](1)} Testing this comment.',1,'task',3,NULL,'2018-09-26 13:02:33.000','2018-09-26 13:02:33.000',0);

INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (51,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_6a4739f26fc10d892695e13cd21c2d3408147110.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,0,0,'2018-09-27 16:15:46.000','2018-09-27 16:15:46.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (52,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_6a4739f26fc10d892695e13cd21c2d3408147110.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,1,0,'2018-09-27 16:16:56.000','2018-09-27 16:16:56.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (53,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_6a4739f26fc10d892695e13cd21c2d3408147110.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,2,0,'2018-09-27 16:17:17.000','2018-09-27 16:17:17.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (54,'code_1.27.2-1536736588_amd64.deb_2d39d06d7835db04bce9524690ff03241a830457.deb','code_1.27.2-1536736588_amd64.deb',1,'attachment',NULL,0,NULL,'new',0,0,0,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (55,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_eb1144cc83bd58051cab2819cb9bea01e4bf8670.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,0,0,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (56,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_dd8a179aed1f7b887dd161bc1ebd77a48e923a69.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,0,0,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (57,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_9a5538c1e196f4a91f9ae667a7598a2e6f44c471.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,3,0,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (58,'code_1.27.2-1536736588_amd64.deb_2d39d06d7835db04bce9524690ff03241a830457.deb','code_1.27.2-1536736588_amd64.deb',1,'attachment',NULL,0,NULL,'new',0,1,0,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (59,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_eb1144cc83bd58051cab2819cb9bea01e4bf8670.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,1,0,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (60,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_dd8a179aed1f7b887dd161bc1ebd77a48e923a69.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,1,0,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (61,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_9a5538c1e196f4a91f9ae667a7598a2e6f44c471.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,4,0,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (62,'code_1.27.2-1536736588_amd64.deb_2d39d06d7835db04bce9524690ff03241a830457.deb','code_1.27.2-1536736588_amd64.deb',1,'attachment',NULL,0,NULL,'new',0,2,0,'2018-09-27 16:25:05.000','2018-09-27 16:25:05.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (63,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_eb1144cc83bd58051cab2819cb9bea01e4bf8670.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,2,0,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (64,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_dd8a179aed1f7b887dd161bc1ebd77a48e923a69.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,2,0,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (65,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_9a5538c1e196f4a91f9ae667a7598a2e6f44c471.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,5,0,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (66,'code_1.27.2-1536736588_amd64.deb_2d39d06d7835db04bce9524690ff03241a830457.deb','code_1.27.2-1536736588_amd64.deb',1,'attachment',NULL,0,NULL,'new',0,3,0,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (67,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_eb1144cc83bd58051cab2819cb9bea01e4bf8670.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,3,0,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (68,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_dd8a179aed1f7b887dd161bc1ebd77a48e923a69.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,3,0,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (69,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv_9a5538c1e196f4a91f9ae667a7598a2e6f44c471.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file (1).csv',1,'attachment',NULL,0,NULL,'new',0,6,0,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (70,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_2ee9fff6f24107ce3cc4d66174db7574cd74f667.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,4,0,'2018-09-27 16:28:05.000','2018-09-27 16:28:05.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (71,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_2ee9fff6f24107ce3cc4d66174db7574cd74f667.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,5,0,'2018-09-27 16:28:58.000','2018-09-27 16:28:58.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (72,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_2ee9fff6f24107ce3cc4d66174db7574cd74f667.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,6,0,'2018-09-27 16:29:49.000','2018-09-27 16:29:49.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (73,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_05d266303325e25f5ca927c38525d03abbb7e05f.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,4,0,'2018-09-27 16:30:50.000','2018-09-27 16:30:50.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (74,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_05d266303325e25f5ca927c38525d03abbb7e05f.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,5,0,'2018-09-27 16:30:53.000','2018-09-27 16:30:53.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (75,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_05d266303325e25f5ca927c38525d03abbb7e05f.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,6,0,'2018-09-27 16:30:56.000','2018-09-27 16:30:56.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (76,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_05d266303325e25f5ca927c38525d03abbb7e05f.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,7,0,'2018-09-27 16:30:58.000','2018-09-27 16:30:58.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (77,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_05d266303325e25f5ca927c38525d03abbb7e05f.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,8,0,'2018-09-27 16:31:02.000','2018-09-27 16:31:02.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (78,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_fb79c59d682d55e40cdb78bd7c92f6d0211cb102.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,9,0,'2018-09-27 16:32:38.000','2018-09-27 16:32:38.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (79,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_fb79c59d682d55e40cdb78bd7c92f6d0211cb102.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,10,0,'2018-09-27 16:33:43.000','2018-09-27 16:33:43.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (80,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_be4b2a42cb33738dca1d38dfce5680f26949a5b3.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,7,0,'2018-09-27 16:38:03.000','2018-09-27 16:38:03.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (81,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_2282ca3f02dee32d38b8c3c25d66e104f6126933.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,11,0,'2018-09-27 16:39:59.000','2018-09-27 16:39:59.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (82,'GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv_2282ca3f02dee32d38b8c3c25d66e104f6126933.csv','GCP_Remittance_for_PSG_09212018_-UPLOAD_file.csv',1,'attachment',NULL,0,NULL,'new',0,12,0,'2018-09-27 16:41:34.000','2018-09-27 16:41:34.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (83,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_c90c724ab79a9f6beeaebbd58b53e40ed87b7195.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,8,0,'2018-09-27 16:42:19.000','2018-09-27 16:42:19.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (84,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_c90c724ab79a9f6beeaebbd58b53e40ed87b7195.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,9,0,'2018-09-27 16:42:30.000','2018-09-27 16:42:30.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (85,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_c90c724ab79a9f6beeaebbd58b53e40ed87b7195.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,10,0,'2018-09-27 16:42:44.000','2018-09-27 16:42:44.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (86,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_c90c724ab79a9f6beeaebbd58b53e40ed87b7195.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,11,0,'2018-09-27 16:42:47.000','2018-09-27 16:42:47.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (87,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_e4fbfad7f91ce3c2040c39c0012da3fe9d84488a.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,12,0,'2018-09-27 16:45:25.000','2018-09-27 16:45:25.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (88,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_e4fbfad7f91ce3c2040c39c0012da3fe9d84488a.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,13,0,'2018-09-27 16:45:29.000','2018-09-27 16:45:29.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (89,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_e4fbfad7f91ce3c2040c39c0012da3fe9d84488a.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,14,0,'2018-09-27 16:45:32.000','2018-09-27 16:45:32.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`tags`,`status`,`isCompleted`,`documentNameCount`,`attachmentId`,`dateAdded`,`dateUpdated`) VALUES (90,'GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv_c90c724ab79a9f6beeaebbd58b53e40ed87b7195.csv','GCP -DOTW Salarly Remittance Report for 081518- FOR UPLOAD.csv',1,'attachment',NULL,0,NULL,'new',0,15,0,'2018-09-27 16:50:10.000','2018-09-27 16:50:10.000');

INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (11,4,'project',1,'2018-09-27 08:37:29.000','2018-09-27 08:37:29.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (12,5,'project',1,'2018-09-27 08:46:51.000','2018-09-27 08:46:51.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (13,6,'project',1,'2018-09-27 09:00:55.000','2018-09-27 09:00:55.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (14,7,'project',1,'2018-09-27 09:17:21.000','2018-09-27 09:17:21.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (15,8,'project',1,'2018-09-27 12:50:58.000','2018-09-27 12:50:58.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (16,9,'project',1,'2018-09-27 13:00:13.000','2018-09-27 13:00:13.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (17,10,'project',1,'2018-09-27 13:03:39.000','2018-09-27 13:03:39.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (18,1,'project',1,'2018-09-27 13:05:22.000','2018-09-27 13:05:22.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (19,2,'project',1,'2018-09-27 13:09:11.000','2018-09-27 13:09:11.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (20,3,'project',1,'2018-09-27 13:11:08.000','2018-09-27 13:11:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (21,4,'project',1,'2018-09-27 13:32:17.000','2018-09-27 13:32:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (22,5,'project',1,'2018-09-27 13:32:18.000','2018-09-27 13:32:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (23,6,'project',1,'2018-09-27 13:33:01.000','2018-09-27 13:33:01.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (24,7,'project',1,'2018-09-27 13:36:55.000','2018-09-27 13:36:55.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (25,8,'project',1,'2018-09-27 13:36:55.000','2018-09-27 13:36:55.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (26,9,'project',1,'2018-09-27 13:36:55.000','2018-09-27 13:36:55.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (27,10,'project',1,'2018-09-27 13:36:55.000','2018-09-27 13:36:55.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (28,11,'project',1,'2018-09-27 14:42:47.000','2018-09-27 14:42:47.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (29,12,'project',1,'2018-09-27 14:42:47.000','2018-09-27 14:42:47.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (30,13,'project',1,'2018-09-27 14:42:47.000','2018-09-27 14:42:47.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (31,14,'project',1,'2018-09-27 15:10:56.000','2018-09-27 15:10:56.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (32,15,'project',NULL,'2018-09-27 15:15:51.000','2018-09-27 15:15:51.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (33,16,'project',NULL,'2018-09-27 15:15:53.000','2018-09-27 15:15:53.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (34,17,'project',1,'2018-09-27 15:16:22.000','2018-09-27 15:16:22.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (35,18,'project',1,'2018-09-27 15:17:51.000','2018-09-27 15:17:51.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (36,19,'project',1,'2018-09-27 15:18:52.000','2018-09-27 15:18:52.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (37,20,'project',1,'2018-09-27 15:19:13.000','2018-09-27 15:19:13.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (38,21,'project',1,'2018-09-27 15:54:17.000','2018-09-27 15:54:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (39,22,'project',1,'2018-09-27 15:54:34.000','2018-09-27 15:54:34.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (40,23,'project',1,'2018-09-27 15:54:52.000','2018-09-27 15:54:52.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (41,24,'project',1,'2018-09-27 15:56:25.000','2018-09-27 15:56:25.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (42,25,'project',1,'2018-09-27 15:58:51.000','2018-09-27 15:58:51.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (43,26,'project',1,'2018-09-27 15:59:18.000','2018-09-27 15:59:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (44,27,'project',1,'2018-09-27 15:59:18.000','2018-09-27 15:59:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (45,28,'project',1,'2018-09-27 16:00:29.000','2018-09-27 16:00:29.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (46,29,'project',1,'2018-09-27 16:00:29.000','2018-09-27 16:00:29.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (47,30,'project',1,'2018-09-27 16:00:29.000','2018-09-27 16:00:29.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (48,31,'project',1,'2018-09-27 16:00:45.000','2018-09-27 16:00:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (49,32,'project',1,'2018-09-27 16:00:45.000','2018-09-27 16:00:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (50,33,'project',1,'2018-09-27 16:00:45.000','2018-09-27 16:00:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (51,34,'project',1,'2018-09-27 16:00:59.000','2018-09-27 16:00:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (52,35,'project',1,'2018-09-27 16:00:59.000','2018-09-27 16:00:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (53,36,'project',1,'2018-09-27 16:00:59.000','2018-09-27 16:00:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (54,37,'project',1,'2018-09-27 16:02:59.000','2018-09-27 16:02:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (55,38,'project',1,'2018-09-27 16:03:50.000','2018-09-27 16:03:50.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (56,39,'project',1,'2018-09-27 16:11:15.000','2018-09-27 16:11:15.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (57,40,'project',1,'2018-09-27 16:13:08.000','2018-09-27 16:13:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (58,41,'project',1,'2018-09-27 16:13:08.000','2018-09-27 16:13:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (59,42,'project',1,'2018-09-27 16:13:08.000','2018-09-27 16:13:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (60,43,'project',1,'2018-09-27 16:13:57.000','2018-09-27 16:13:57.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (61,44,'project',1,'2018-09-27 16:13:57.000','2018-09-27 16:13:57.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (62,45,'project',1,'2018-09-27 16:13:57.000','2018-09-27 16:13:57.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (63,46,'project',1,'2018-09-27 16:14:05.000','2018-09-27 16:14:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (64,47,'project',1,'2018-09-27 16:14:05.000','2018-09-27 16:14:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (65,48,'project',1,'2018-09-27 16:14:05.000','2018-09-27 16:14:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (66,49,'project',1,'2018-09-27 16:14:09.000','2018-09-27 16:14:09.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (67,50,'project',1,'2018-09-27 16:14:13.000','2018-09-27 16:14:13.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (68,51,'project',1,'2018-09-27 16:15:46.000','2018-09-27 16:15:46.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (69,52,'project',1,'2018-09-27 16:16:56.000','2018-09-27 16:16:56.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (70,53,'project',1,'2018-09-27 16:17:17.000','2018-09-27 16:17:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (71,54,'project',1,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (72,55,'project',1,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (73,56,'project',1,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (74,57,'project',1,'2018-09-27 16:21:45.000','2018-09-27 16:21:45.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (75,58,'project',1,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (76,59,'project',1,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (77,60,'project',1,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (78,61,'project',1,'2018-09-27 16:24:18.000','2018-09-27 16:24:18.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (79,62,'project',1,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (80,63,'project',1,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (81,64,'project',1,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (82,65,'project',1,'2018-09-27 16:25:06.000','2018-09-27 16:25:06.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (83,66,'project',1,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (84,67,'project',1,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (85,68,'project',1,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (86,69,'project',1,'2018-09-27 16:25:48.000','2018-09-27 16:25:48.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (87,70,'project',1,'2018-09-27 16:28:05.000','2018-09-27 16:28:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (88,71,'project',1,'2018-09-27 16:28:58.000','2018-09-27 16:28:58.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (89,72,'project',1,'2018-09-27 16:29:49.000','2018-09-27 16:29:49.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (90,73,'project',1,'2018-09-27 16:30:50.000','2018-09-27 16:30:50.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (91,74,'project',1,'2018-09-27 16:30:53.000','2018-09-27 16:30:53.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (92,75,'project',1,'2018-09-27 16:30:56.000','2018-09-27 16:30:56.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (93,76,'project',1,'2018-09-27 16:30:58.000','2018-09-27 16:30:58.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (94,77,'project',1,'2018-09-27 16:31:02.000','2018-09-27 16:31:02.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (95,78,'project',1,'2018-09-27 16:32:38.000','2018-09-27 16:32:38.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (96,79,'project',1,'2018-09-27 16:33:43.000','2018-09-27 16:33:43.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (97,80,'project',1,'2018-09-27 16:38:03.000','2018-09-27 16:38:03.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (98,81,'project',1,'2018-09-27 16:39:59.000','2018-09-27 16:39:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (99,82,'project',1,'2018-09-27 16:41:34.000','2018-09-27 16:41:34.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (100,83,'project',1,'2018-09-27 16:42:19.000','2018-09-27 16:42:19.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (101,84,'project',1,'2018-09-27 16:42:30.000','2018-09-27 16:42:30.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (102,85,'project',1,'2018-09-27 16:42:44.000','2018-09-27 16:42:44.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (103,86,'project',1,'2018-09-27 16:42:47.000','2018-09-27 16:42:47.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (104,87,'project',1,'2018-09-27 16:45:25.000','2018-09-27 16:45:25.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (105,88,'project',1,'2018-09-27 16:45:29.000','2018-09-27 16:45:29.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (106,89,'project',1,'2018-09-27 16:45:32.000','2018-09-27 16:45:32.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (107,90,'project',1,'2018-09-27 16:50:10.000','2018-09-27 16:50:10.000');

INSERT INTO `folder` (`id`,`name`,`projectId`,`parentId`,`dateAdded`,`dateUpdated`,`isDeleted`,`isFolder`,`type`,`createdBy`) VALUES (1,'someFolder',2,NULL,'2018-09-17 02:13:18.000','2018-09-17 10:13:18.000',0,1,'library',11);
INSERT INTO `folder` (`id`,`name`,`projectId`,`parentId`,`dateAdded`,`dateUpdated`,`isDeleted`,`isFolder`,`type`,`createdBy`) VALUES (2,'otherFolder',2,NULL,'2018-09-17 02:30:39.000','2018-09-17 10:30:39.000',0,1,'new',11);
INSERT INTO `folder` (`id`,`name`,`projectId`,`parentId`,`dateAdded`,`dateUpdated`,`isDeleted`,`isFolder`,`type`,`createdBy`) VALUES (3,'childFolder',2,2,'2018-09-17 02:31:06.000','2018-09-17 10:31:06.000',0,1,'new',11);
INSERT INTO `folder` (`id`,`name`,`projectId`,`parentId`,`dateAdded`,`dateUpdated`,`isDeleted`,`isFolder`,`type`,`createdBy`) VALUES (4,'test 1',5,NULL,'2018-09-17 04:42:01.000','2018-09-17 12:42:01.000',0,1,'new',31);
INSERT INTO `folder` (`id`,`name`,`projectId`,`parentId`,`dateAdded`,`dateUpdated`,`isDeleted`,`isFolder`,`type`,`createdBy`) VALUES (5,'test 2',5,4,'2018-09-17 04:42:22.000','2018-09-17 12:42:22.000',0,1,'new',31);



INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (1,'team',10,'project',1,'assignedTo','2018-09-24 13:57:30.000','2018-09-24 13:57:30.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (2,'team',12,'project',1,'assignedTo','2018-09-24 13:57:36.000','2018-09-24 13:57:36.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (3,'users',23,'project',1,'project manager','2018-09-24 13:57:43.000','2018-09-24 13:57:43.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (170,'users',1,'project',1,'assignedTo','2018-09-26 10:44:59.000','2018-09-26 10:44:59.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (216,'users',1,'task',2,'assignedTo','2018-09-26 14:09:47.000','2018-09-26 14:09:47.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (217,'users',1,'task',3,'assignedTo','2018-09-26 14:09:47.000','2018-09-26 14:09:47.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (218,'users',1,'task',1,'assignedTo','2018-09-26 14:09:47.000','2018-09-26 14:09:47.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`dateAdded`,`dateUpdated`) VALUES (219,'users',31,'task',4,'assignedTo','2018-09-27 09:07:58.000','2018-09-27 09:07:58.000');

INSERT INTO `project` (`id`,`project`,`statusId`,`typeId`,`projectType`,`tinNo`,`companyAddress`,`classification`,`projectNameCount`,`createdBy`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Mobbiz Solutions',NULL,2,NULL,NULL,NULL,NULL,0,6,'2018-09-20 02:13:39.000','2018-09-26 12:46:04.000',1,0);

INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (9,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:10:51.000','2018-09-26 09:10:51.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (10,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:11:01.000','2018-09-26 09:11:01.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (11,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:11:21.000','2018-09-26 09:11:21.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (12,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:11:30.000','2018-09-26 09:11:30.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (13,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:12:08.000','2018-09-26 09:12:08.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (14,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:13:46.000','2018-09-26 09:13:46.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (15,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:25:49.000','2018-09-26 09:25:49.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (16,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:27:16.000','2018-09-26 09:27:16.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (17,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:27:31.000','2018-09-26 09:27:31.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (18,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:27:39.000','2018-09-26 09:27:39.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (19,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:29:13.000','2018-09-26 09:29:13.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (20,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:29:27.000','2018-09-26 09:29:27.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (21,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:30:41.000','2018-09-26 09:30:41.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (22,'Task Overdue',3,1,0,NULL,NULL,NULL,'2018-09-26 09:32:54.000','2018-09-26 09:32:54.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (23,'Task Overdue',31,15,0,NULL,NULL,NULL,'2018-09-26 09:35:27.000','2018-09-26 09:35:27.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (24,'Task Overdue',31,15,0,NULL,NULL,NULL,'2018-09-26 09:38:29.000','2018-09-26 09:38:29.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (25,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:39:05.000','2018-09-26 09:39:05.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (26,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:39:35.000','2018-09-26 09:39:35.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (27,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:40:04.000','2018-09-26 09:40:04.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (28,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:40:17.000','2018-09-26 09:40:17.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (29,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:40:48.000','2018-09-26 09:40:48.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (30,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:41:05.000','2018-09-26 09:41:05.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (31,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:41:26.000','2018-09-26 09:41:26.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (32,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:41:31.000','2018-09-26 09:41:31.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (33,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:41:44.000','2018-09-26 09:41:44.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (34,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:42:00.000','2018-09-26 09:42:00.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (35,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:42:06.000','2018-09-26 09:42:06.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (36,'Task Overdue',3,17,0,NULL,NULL,NULL,'2018-09-26 09:43:37.000','2018-09-26 09:43:37.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (37,'Task Overdue',31,1,0,NULL,NULL,NULL,'2018-09-26 10:20:13.000','2018-09-26 10:20:13.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (38,'Task Overdue',31,1,0,NULL,NULL,NULL,'2018-09-26 10:37:34.000','2018-09-26 10:37:34.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (39,'Task Overdue',31,1,0,NULL,NULL,NULL,'2018-09-26 10:37:43.000','2018-09-26 10:37:43.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`taskId`,`seen`,`projectId`,`reminderTypeId`,`reminderType`,`dateAdded`,`dateUpdated`) VALUES (40,'tagged in comment',1,NULL,0,1,3,'task','2018-09-26 13:02:33.000','2018-09-26 13:02:33.000');

INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Internal','Master Admin','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','Admin','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Internal','Manager','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Internal','Standard User','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'External','Manager Guest','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (6,'External','User Guest','2018-07-27 08:43:16.000','2018-07-27 16:43:16.000',1,0);

INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (23,'A8hCNXmoc1ZrJ3WfUy9z9KYVWSSyfG6h9AJGV7MYcLYB',33,'{\"id\":33,\"firstName\":\"externalstduser\",\"lastName\":\"\",\"phoneNumber\":null,\"companyId\":null,\"username\":\"test_external_standard_user\",\"userType\":\"External\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"afsdfadsfa@test.com\",\"dateAdded\":\"2018-09-12T01:02:42.000Z\",\"dateUpdated\":\"2018-09-12T01:14:48.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":\"someCompany\",\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-09-12 17:16:48.000','2018-09-13 01:40:03.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (29,'9ShS3HRSZPutmzLw13RtwywsW3MuqVrBNhSUUBLRXfUw',11,'{\"id\":11,\"firstName\":\"Ivan\",\"lastName\":\"Pintor\",\"phoneNumber\":\"1234\",\"companyId\":null,\"username\":\"ivan.admin\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"ivan.pintor@mobbizsolutions.com\",\"dateAdded\":\"2018-09-03T02:38:08.000Z\",\"dateUpdated\":\"2018-09-03T02:50:58.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-09-13 17:42:12.000','2018-09-17 18:35:23.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (53,'GiCWPzLJU4hVKxFGnAyzWEKrXtWrBhdKH2B6QayPdXqR',1,'{\"id\":1,\"firstName\":\"John Aldrin1\",\"lastName\":\"Tapia1\",\"phoneNumber\":\"1111\",\"companyId\":null,\"username\":\"master.admin\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"johnaldrin.tapia@volenday.com\",\"dateAdded\":\"2018-07-25T00:44:35.000Z\",\"dateUpdated\":\"2018-08-22T09:26:53.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-09-24 14:57:48.000','2018-09-27 17:00:29.000');

INSERT INTO `share` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`shareType`,`shareId`,`sharedBy`,`dateAdded`,`dateUpdated`) VALUES (1,'users',7,'project',2,'folder',1,8,'2018-09-10 05:51:52.000','2018-09-10 13:51:52.000');
INSERT INTO `share` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`shareType`,`shareId`,`sharedBy`,`dateAdded`,`dateUpdated`) VALUES (2,'users',7,'project',2,'folder',1,11,'2018-09-17 02:13:39.000','2018-09-17 10:13:39.000');





INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (1,NULL,'task',1,'document',70,'2018-09-27 16:28:05.000','2018-09-27 16:28:05.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (2,NULL,'task',1,'document',71,'2018-09-27 16:28:58.000','2018-09-27 16:28:58.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (3,NULL,'task',1,'document',72,'2018-09-27 16:29:49.000','2018-09-27 16:29:49.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (4,NULL,'task',1,'document',73,'2018-09-27 16:30:50.000','2018-09-27 16:30:50.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (5,NULL,'task',1,'document',78,'2018-09-27 16:32:38.000','2018-09-27 16:32:38.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (6,NULL,'task',1,'document',79,'2018-09-27 16:33:43.000','2018-09-27 16:33:43.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (7,NULL,'task',1,'document',80,'2018-09-27 16:38:03.000','2018-09-27 16:38:03.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (8,NULL,'task',1,'document',81,'2018-09-27 16:39:59.000','2018-09-27 16:39:59.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (9,NULL,'task',1,'document',82,'2018-09-27 16:41:34.000','2018-09-27 16:41:34.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (10,NULL,'task',1,'document',83,'2018-09-27 16:42:19.000','2018-09-27 16:42:19.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (11,NULL,'task',1,'document',87,'2018-09-27 16:45:25.000','2018-09-27 16:45:25.000',0,0);
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`dateAdded`,`dateUpdated`,`isCompleted`,`isDeleted`) VALUES (12,NULL,'task',1,'document',90,'2018-09-27 16:50:10.000','2018-09-27 16:50:10.000',0,0);

INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`linkTaskId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,1,'Stage One: Analysis','A common misconception among business owners is that the most important part of development are the design and the code. Yes, good design and solid code are both extremely important. However, they do zero good if the software doesn’t suit your business needs.\n\nIn our minds, the analysis stage is the most crucial step in software development, and the RTS Labs teams focus on this stage a lot, so we can get it right the first time. Beyond building something that is beautifully designed, user friendly, and bug free, you need a tool that will actually produce a return on your investment.\n\nAs an example of what should be happening during this crucial stage, we spend time learning your business processes, pain points, challenges, technical ecosystem, and goals. Once that information is gathered, we validate goals and present you with a scope of work.',6,'2018-10-27 00:00:00.000','2018-09-27 00:00:00.000',NULL,NULL,NULL,1,'months',1,3,NULL,'2018-09-26 14:09:47.000','2018-09-26 14:09:47.000',1,0);
INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`linkTaskId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,1,'Stage One: Analysis','A common misconception among business owners is that the most important part of development are the design and the code. Yes, good design and solid code are both extremely important. However, they do zero good if the software doesn’t suit your business needs.\n\nIn our minds, the analysis stage is the most crucial step in software development, and the RTS Labs teams focus on this stage a lot, so we can get it right the first time. Beyond building something that is beautifully designed, user friendly, and bug free, you need a tool that will actually produce a return on your investment.\n\nAs an example of what should be happening during this crucial stage, we spend time learning your business processes, pain points, challenges, technical ecosystem, and goals. Once that information is gathered, we validate goals and present you with a scope of work.',6,'2018-11-27 00:00:00.000','2018-10-27 00:00:00.000',NULL,NULL,NULL,1,'months',1,3,1,'2018-09-26 14:09:47.000','2018-09-26 14:09:47.000',1,0);

INSERT INTO `task_checklist` (`id`,`completed`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (25,1,'test24',1,NULL,'[83]',1,'2018-09-27 16:42:19.000','2018-09-27 17:00:43.000');
INSERT INTO `task_checklist` (`id`,`completed`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (26,1,'test24',2,25,NULL,1,'2018-09-27 16:42:19.000','2018-09-27 16:59:50.000');
INSERT INTO `task_checklist` (`id`,`completed`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (27,1,'Test334',1,NULL,'[87]',1,'2018-09-27 16:45:25.000','2018-09-27 17:00:42.000');
INSERT INTO `task_checklist` (`id`,`completed`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (28,0,'Test334',2,27,NULL,1,'2018-09-27 16:45:25.000','2018-09-27 16:45:32.000');



INSERT INTO `team` (`id`,`teamLeaderId`,`usersId`,`team`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (10,11,1,'Borja Team','2018-08-30 03:36:34.000','2018-08-30 11:36:34.000',1,0);
INSERT INTO `team` (`id`,`teamLeaderId`,`usersId`,`team`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (11,11,6,'Team Ivan','2018-09-04 02:56:22.000','2018-09-04 10:56:22.000',1,0);
INSERT INTO `team` (`id`,`teamLeaderId`,`usersId`,`team`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (12,5,23,'DevOps','2018-09-06 17:16:04.000','2018-09-19 01:10:15.000',1,0);

INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Client','project','2018-09-10 04:53:31.000','2018-09-10 12:53:31.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','project','2018-09-10 04:53:31.000','2018-09-10 12:53:31.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Private','project','2018-09-10 04:53:31.000','2018-09-10 12:53:31.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Output based','workstream','2018-09-10 04:53:31.000','2018-09-10 12:53:31.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'Time based','workstream','2018-09-10 04:53:32.000','2018-09-10 12:53:32.000',1,0);

INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (1,'John Aldrin1','Tapia1','1111',NULL,'master.admin','c08f94cdbfd13e47333a2d6e18c5ab8b6d2c3fbf','4qVnChLYBUpVWuLXQsZBKQJcYiq5ZVRn','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','johnaldrin.tapia@volenday.com','2018-07-25 08:44:35.000','2018-08-22 17:26:53.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (2,'Aldous','',NULL,NULL,'standard.user2','bfb18fbd5b92f95a22f39f559dfe0fffb9796af3','9yvvVWgkHIqNmrFkyrn1oFQoe7V77X9m','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','Aldoustester@volenday.com','2018-07-28 01:08:53.000','2018-09-19 16:47:44.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (3,'testuser2','volenday','2323',NULL,'standard.user','c7b6586d67a1860743f11898c97462624c207d43','7VvRcUa6uYqKDu6tnY9T3Pvmahub40Dv','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testuser2@volenday.com','2018-07-28 09:19:45.000','2018-07-30 05:07:30.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (5,'Internal','Manager','090937373',NULL,'manager','0d44ef43111199b99bd49942c10968d5378b7bf8','CF7DRHEnFUwX2WhmtbJs0D94Kf4W9qma','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testmanager@cfo.com','2018-08-06 01:14:47.000','2018-08-06 09:18:52.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (6,'test','admin','6060',NULL,'admin','7d90fd6eb269160e01cb466e18e807b76230180b','JwbvRNedPgdTbU4Jw32leTorsHoZ8he0','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testadmin@cfo.com','2018-08-07 01:18:24.000','2018-08-07 09:19:09.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (7,'Randur','Duran','0999999999',NULL,'randur.duran','f4ce619793537995f507efb5ebf68127c9c0d4f1','YkQGb7hzWSGCtMHoL9gBbFrqIU0jiPz0','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randurduran@volenday.com','2018-08-14 16:11:43.000','2018-08-15 00:12:00.000',1,0,'DevOps');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (8,'Standard','User2','099999999',NULL,'test.user2','c5d605ae120c02ce74946b3691aef166e3bbd3f5','ut5IG2lLZbMx0wHViPk8l25NYY5BQaky','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','test.user2@gmail.com','2018-08-18 10:19:45.000','2018-08-21 23:33:23.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (9,'User','Guest','695932116654',NULL,'user.guest','66ef2bcfe3e396ca04aad34de0b92be59f6cd06f','I55b9DevwFvS7pm0HFLG7YSJNRfwkD6A','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','user.guest@volenday.com','2018-08-29 08:42:00.000','2018-08-29 16:42:50.000',1,0,'Test Company');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (10,'Aian','Fajardo','24',NULL,'aian.fajardo','dcc0796f98d4f69eb72d8698b4c60e4e35c2361e','4GzyPJs7wwsKrGxpR72R4hE5b9Qfvepr','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','aian.fajardo@volenday.com','2018-09-03 07:54:33.000','2018-09-05 00:35:52.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (11,'Ivan','Pintor','1234',NULL,'ivan.admin','cc221dd2a0668b081211ac4466e1f2c39cde6ed1','c15sE5AFnXuRy8z56AZYtIdV4PL03pIG','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','ivan.pintor@mobbizsolutions.com','2018-09-03 10:38:08.000','2018-09-03 18:50:58.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (20,'Andrien','Pecson','2314651994161',NULL,'andrien.pecson','4551d20d9ea53f57226d7790033e8948d2550b5e','4rb9Xfzx4hKJvckrdEpopQ7wpqpkKNlu','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','andrien.pecson@volenday.com','2018-09-04 08:35:11.000','2018-09-04 16:35:24.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (21,'Borja','Hernandez','0946313563213',NULL,'borja.hernandez','34a00c6dfd993c60dc1812e5d2b6f82addfbd158','WEnHOypmB1WAdQdhsLHiJEZTPGN79U0n','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','borja.celorio@volenday.com','2018-09-04 17:02:34.000','2018-09-05 01:03:17.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (22,'Borja','Manager(int)','123456',NULL,'BorjaManager(int)','944a9f105ec9f597849f574c07c8fbe7457ad15e','1jKaHQWlF2AjlO35yiW5Px1EwRzgAhvR','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','BorjaManager@g.com','2018-09-05 03:38:04.000','2018-09-05 11:51:17.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (23,'Borja','Admin','1123456',NULL,'BorjaAdmin','66bbdffd219f1672e196917003930c3ce0168b97','WPUjJaw9zgX2kVSy0FpPJvbNSCz4Mzhb','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','BorjaAdmin@g.com','2018-09-05 03:38:47.000','2018-09-05 11:52:46.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (24,'Borja','MasterAdm','9999999999',NULL,'BorjaMasterAdm','56a62e8f8f582dcf85f459f6a9929d1c858d7aa3','BfxxKb5VskXaSDrc9eOhIKDVdmw9xHar','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','BorjaMasterAdm@g.com','2018-09-05 03:39:32.000','2018-09-05 11:52:35.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (25,'Borja','Standard','5555555',NULL,'BorjaStandard','82d9aaf5be997680e28e07af2c10cac940894f79','m9lrane9PV05taTN0GrT6Qaa9bEahn7A','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','BorjaStandard@g.com','2018-09-05 03:40:22.000','2018-09-05 11:52:22.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (26,'Borja','_EXT_Mng','6565656565',NULL,'Borja_EXT_Mng','058f4c1b74281c24faee0e5705249a0e8d14b428','TvbERo0LhFhJuL1l1qbNUFhsttHeLhS1','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','Borja_EXT_Mng@g.com','2018-09-05 03:41:40.000','2018-09-05 11:52:09.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (27,'Borja','_EXT_user','8888888888',NULL,'Borja_EXT_user','6e34b16c773b4e12503f3a6e098476281b0549d7','wgBY5dfDkrdLYdiYCiPEPbWlTQvfbIhc','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','Borja_EXT_user@g.com','2018-09-05 03:42:28.000','2018-09-05 11:51:58.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (28,'Mickael','',NULL,NULL,'mickael','3b12fcebde59082db6a30fc1f13702ed5dc9a8fd','M0KI0pOR5T1XdnMFIzWIR7S03qVRqWjP','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','mickael@cloudcfo.ph','2018-09-05 06:25:14.000','2018-09-05 14:25:58.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (29,'External','Manager','',NULL,'external.manager','0b649b10d60eb93ed94d3d7dc47b3d45e59e5cae','lLoQ1tOBSfKOgbxdmuhrHVMdxAyfcErO','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','external.manager@volenday.com','2018-09-06 03:00:05.000','2018-09-06 11:04:59.000',1,0,'ABC Corp');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (31,'randur','duran','0999808909',NULL,'randur.admin','ff8e3a4e231a0a3e1a67153cbee32ea88a48547e','VvwHifgtSt87hWERdf8wLyJS1y7OO4zH','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-09-07 03:18:13.000','2018-09-07 11:18:39.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (32,'Louise','Villanueva','',NULL,'marialouise.villanueva','e62ed1f722fdbd2332526a9da699aeddf68a08c9','LurrYDrPoVsAxgvJ9SEdw9PdSCq0WVHO','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','marialouise.villanueva@volenday.com','2018-09-10 01:23:33.000','2018-09-10 09:23:44.000',1,0,'Mobbiz');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (33,'externalstduser','',NULL,NULL,'test_external_standard_user','713b3c2bb6658423bca888dc176fb449a65425cc','xOuWyp3oLEoAOtJ3RrTgT24fAba7OSlV','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','afsdfadsfa@test.com','2018-09-12 09:02:42.000','2018-09-12 17:14:48.000',1,0,'someCompany');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (34,'Andrien','Pecson','9560729694',NULL,'andrienpecsonext','7dc091bddff5cd07f9cc7da0086d79ff09782a61','DsvgmaetOq0dSn1hKNkktNyXaPktDBIG','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','andrien.pecson@gmail.com','2018-09-19 17:22:16.000','2018-09-20 08:17:32.000',1,0,NULL);



INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (34,3,4,'2018-08-24 01:40:06.000','2018-08-24 09:40:06.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (38,1,1,'2018-08-24 01:41:56.000','2018-08-24 09:41:56.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (47,6,2,'2018-09-04 05:36:19.000','2018-09-04 13:36:19.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (55,2,4,'2018-09-04 08:58:51.000','2018-09-04 16:58:51.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (69,10,6,'2018-09-05 00:40:40.000','2018-09-05 08:40:40.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (72,20,4,'2018-09-05 01:01:11.000','2018-09-05 09:01:11.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (75,8,4,'2018-09-05 01:04:49.000','2018-09-05 09:04:49.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (76,21,3,'2018-09-05 02:29:56.000','2018-09-05 10:29:56.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (78,22,3,'2018-09-05 03:38:04.000','2018-09-05 11:38:04.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (79,23,2,'2018-09-05 03:38:47.000','2018-09-05 11:38:47.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (80,24,1,'2018-09-05 03:39:32.000','2018-09-05 11:39:32.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (81,25,4,'2018-09-05 03:40:22.000','2018-09-05 11:40:22.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (82,26,5,'2018-09-05 03:41:40.000','2018-09-05 11:41:40.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (83,27,6,'2018-09-05 03:42:28.000','2018-09-05 11:42:28.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (85,9,6,'2018-09-05 05:07:47.000','2018-09-05 13:07:47.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (86,28,2,'2018-09-05 06:25:14.000','2018-09-05 14:25:14.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (87,29,5,'2018-09-06 03:00:05.000','2018-09-06 11:00:05.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (89,31,2,'2018-09-07 03:18:13.000','2018-09-07 11:18:13.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (90,5,3,'2018-09-07 05:56:07.000','2018-09-07 13:56:07.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (91,32,5,'2018-09-10 01:23:33.000','2018-09-10 09:23:33.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (92,11,2,'2018-09-10 05:01:33.000','2018-09-10 13:01:33.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (94,33,6,'2018-09-12 09:02:42.000','2018-09-12 17:02:42.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (95,7,5,'2018-09-19 14:11:33.000','2018-09-19 14:11:33.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (96,34,5,'2018-09-19 17:22:16.000','2018-09-19 17:22:16.000',1,0);

INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (27,2,12,'2018-09-20 08:18:20.000','2018-09-20 08:18:20.000',1,0);
INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (28,31,12,'2018-09-20 08:18:20.000','2018-09-20 08:18:20.000',1,0);
INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (29,3,12,'2018-09-20 08:18:20.000','2018-09-20 08:18:20.000',1,0);
INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (30,21,11,'2018-09-20 08:18:46.000','2018-09-20 08:18:46.000',1,0);
INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (31,31,11,'2018-09-20 08:18:46.000','2018-09-20 08:18:46.000',1,0);
INSERT INTO `users_team` (`id`,`usersId`,`teamId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (32,5,11,'2018-09-20 08:18:46.000','2018-09-20 08:18:46.000',1,0);

INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,2,'PAYROLL',NULL,NULL,0,NULL,4,'2018-09-16 18:07:19.000','2018-09-19 15:18:16.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,3,'ws to be deleted',NULL,NULL,0,NULL,4,'2018-09-16 18:28:10.000','2018-09-17 10:29:15.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,4,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-17 02:29:51.000','2018-09-19 16:20:18.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,5,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-17 04:39:36.000','2018-09-19 16:20:20.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (6,1,'Software Development',NULL,'Software Development is the process of conceiving, specifying, designing, programming, documenting, testing, and bug fixing involved in creating and maintaining applications, frameworks, or other software components.',0,NULL,4,'2018-09-17 10:05:10.000','2018-09-19 17:50:04.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (7,2,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-19 13:25:29.000','2018-09-19 15:18:16.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (8,3,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-19 13:25:50.000','2018-09-19 15:18:18.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (9,4,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-19 15:21:59.000','2018-09-19 16:20:18.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (10,5,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-19 15:25:29.000','2018-09-19 16:20:20.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (11,6,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-20 09:56:36.000','2018-09-20 10:02:25.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (12,7,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-20 10:02:54.000','2018-09-20 10:10:21.000',1,1);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (13,8,'Default Workstream',NULL,NULL,NULL,NULL,4,'2018-09-20 10:10:32.000','2018-09-20 10:10:32.000',1,0);