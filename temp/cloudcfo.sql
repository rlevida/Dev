DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task') DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `actionType` enum('created','modified','deleted') DEFAULT NULL,
  `old` text,
  `new` text,
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `blocked_ips`;
CREATE TABLE IF NOT EXISTS `blocked_ips` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(62) COLLATE utf8mb4_bin DEFAULT NULL,
  `block_time` datetime DEFAULT NULL,
  `del_flag` int(1) DEFAULT '0',
  `date_added` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
  `linkType` enum('project','workstream','task','document') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `status` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `document`;
CREATE TABLE IF NOT EXISTS `document` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` text COLLATE utf8mb4_bin,
  `origin` text COLLATE utf8mb4_bin,
  `uploadedBy` bigint(20) DEFAULT NULL,
  `type` varchar(20) COLLATE utf8mb4_bin DEFAULT NULL,
  `folderId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `status` enum('new','library','archived') COLLATE utf8mb4_bin DEFAULT NULL,
  `isCompleted` tinyint(1) DEFAULT '0',
  `documentNameCount` int(11) NOT NULL DEFAULT '0',
  `attachmentId` int(11) NOT NULL DEFAULT '0',
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `document_link`;
CREATE TABLE IF NOT EXISTS `document_link` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `documentId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `usersType` enum('users','team') COLLATE utf8mb4_bin DEFAULT NULL,
  `userTypeLinkId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `memberType` enum('assignedTo','Follower','responsible','project manager') COLLATE utf8mb4_bin DEFAULT NULL,
  `receiveNotification` tinyint(1) DEFAULT '1',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `project`;
CREATE TABLE IF NOT EXISTS `project` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `project` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `statusId` bigint(20) DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `projectType` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `tinNo` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `companyAddress` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `classification` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `projectNameCount` int(11) NOT NULL DEFAULT '0',
  `createdBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `reminder`;
CREATE TABLE IF NOT EXISTS `reminder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reminderDetail` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT '0',
  `projectId` bigint(20) DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `linkType` enum('task','document','workstream') COLLATE utf8mb4_bin DEFAULT NULL,
  `type` enum('For Approval','Task Rejected','Task Overdue','Task Due Today','Tag in Comment','Task Completed') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `linkType` enum('user','workstream','task','conversation','document','others') DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `tagType` enum('user','workstream','task','conversation','document','folder') DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `isCompleted` tinyint(1) DEFAULT '0',
  `tagTypeId` bigint(20) DEFAULT NULL,
  `projectId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task`;
CREATE TABLE IF NOT EXISTS `task` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `task` text COLLATE utf8mb4_bin,
  `description` text COLLATE utf8mb4_bin,
  `workstreamId` bigint(20) DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `status` enum('In Progress','For Approval','Completed') COLLATE utf8mb4_bin DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `periodic` tinyint(1) DEFAULT '0',
  `periodType` enum('years','months','weeks','days') COLLATE utf8mb4_bin DEFAULT NULL,
  `period` int(11) DEFAULT NULL,
  `periodInstance` int(11) DEFAULT '0',
  `periodTask` bigint(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `approvalRequired` tinyint(1) DEFAULT '0',
  `approverId` bigint(20) DEFAULT NULL,
  `approvalDueDate` datetime DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_checklist`;
CREATE TABLE IF NOT EXISTS `task_checklist` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `isCompleted` tinyint(1) DEFAULT '0',
  `isDocument` tinyint(1) DEFAULT '0',
  `isMandatory` tinyint(1) DEFAULT '0',
  `description` text,
  `taskId` bigint(20) DEFAULT NULL,
  `periodChecklist` bigint(20) DEFAULT NULL,
  `documents` varchar(50) DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=latin1;

DROP TABLE IF EXISTS `task_dependency`;
CREATE TABLE IF NOT EXISTS `task_dependency` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` bigint(20) DEFAULT NULL,
  `dependencyType` enum('Preceded by','Succeeding') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkTaskId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_rejected`;
CREATE TABLE IF NOT EXISTS `task_rejected` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `taskId` bigint(20) DEFAULT NULL,
  `workstreamId` bigint(20) DEFAULT NULL,
  `reminderId` bigint(20) DEFAULT NULL,
  `approverId` bigint(20) DEFAULT NULL,
  `approvalDueDate` datetime DEFAULT NULL,
  `message` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `team`;
CREATE TABLE IF NOT EXISTS `team` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `team` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `teamLeaderId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_forgot_password`;
CREATE TABLE IF NOT EXISTS `users_forgot_password` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `hash` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (1,1,'task',13,'modified','{\"task_details\":{\"task\":\"periods\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:02:46.000','2018-10-23 17:02:46.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (2,1,'task',14,'modified','{\"task_details\":{\"task\":\"periods\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:02:46.000','2018-10-23 17:02:46.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (3,1,'task',12,'modified','{\"task_details\":{\"task\":\"periods\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:02:46.000','2018-10-23 17:02:46.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (4,1,'task',13,'modified','{\"task_details\":{\"task\":\"period\"}}','{\"task_details\":{\"task\":\"periodal\"}}','2018-10-23 09:03:59.000','2018-10-23 17:03:59.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (5,1,'task',14,'modified','{\"task_details\":{\"task\":\"period\"}}','{\"task_details\":{\"task\":\"periodal\"}}','2018-10-23 09:03:59.000','2018-10-23 17:03:59.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (6,1,'task',12,'modified','{\"task_details\":{\"task\":\"period\"}}','{\"task_details\":{\"task\":\"periodal\"}}','2018-10-23 09:03:59.000','2018-10-23 17:03:59.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (7,1,'task',13,'modified','{\"task_details\":{\"task\":\"periodal\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:04:48.000','2018-10-23 17:04:48.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (8,1,'task',14,'modified','{\"task_details\":{\"task\":\"periodal\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:04:48.000','2018-10-23 17:04:48.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`dateAdded`,`dateUpdated`) VALUES (9,1,'task',12,'modified','{\"task_details\":{\"task\":\"periodal\"}}','{\"task_details\":{\"task\":\"period\"}}','2018-10-23 09:04:48.000','2018-10-23 17:04:48.000');















INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (136,'users',23,'project',4,'project manager',1,'2018-10-16 15:11:56.000','2018-10-16 15:11:56.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (137,'users',20,'project',4,'assignedTo',1,'2018-10-16 15:12:01.000','2018-10-16 15:12:01.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (138,'users',21,'project',4,'assignedTo',1,'2018-10-16 15:12:06.000','2018-10-16 15:12:06.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (139,'users',2,'project',4,'assignedTo',1,'2018-10-16 15:12:10.000','2018-10-16 15:12:10.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (140,'users',22,'project',4,'assignedTo',1,'2018-10-16 15:12:15.000','2018-10-16 15:12:15.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`dateAdded`,`dateUpdated`) VALUES (141,'users',23,'workstream',4,'responsible',1,'2018-10-16 15:12:53.000','2018-10-16 15:12:53.000');

INSERT INTO `project` (`id`,`project`,`statusId`,`typeId`,`projectType`,`tinNo`,`companyAddress`,`classification`,`projectNameCount`,`createdBy`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Mobbiz Solutions',NULL,2,NULL,NULL,NULL,NULL,0,1,'2018-10-16 15:11:56.000','2018-10-16 15:11:56.000',1,0);

INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`seen`,`projectId`,`linkId`,`linkType`,`type`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (3,'Assigned as approver',22,0,3,17,'task','For Approval',7,'2018-10-15 04:58:32.000','2018-10-15 12:58:32.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`seen`,`projectId`,`linkId`,`linkType`,`type`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (4,'Assigned as approver',40,0,1,4,'task','For Approval',36,'2018-10-15 05:21:58.000','2018-10-15 13:21:58.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`seen`,`projectId`,`linkId`,`linkType`,`type`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (5,'Task Completed',20,0,2,56,'task','Task Completed',1,'2018-10-16 14:57:29.000','2018-10-16 14:57:29.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`seen`,`projectId`,`linkId`,`linkType`,`type`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (6,'Task Completed',0,0,2,56,'task','Task Completed',1,'2018-10-16 14:57:43.000','2018-10-16 14:57:43.000');
INSERT INTO `reminder` (`id`,`reminderDetail`,`usersId`,`seen`,`projectId`,`linkId`,`linkType`,`type`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (7,'test',20,0,2,56,'task','Task Rejected',1,'2018-10-16 15:00:02.000','2018-10-16 15:00:02.000');

INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Internal','Master Admin','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','Admin','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Internal','Manager','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Internal','Standard User','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'External','Manager Guest','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (6,'External','User Guest','2018-09-28 07:23:44.000','2018-09-28 15:23:44.000',1,0);

INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (5,'8fDfnq5o7rHzE1UEVEhJv6Gw54tTEEvfue6h4bcMsMNT',36,'{\"id\":36,\"firstName\":\"randur.iternal\",\"lastName\":\"user1\",\"phoneNumber\":\"0890890\",\"companyId\":null,\"username\":\"randur.internal.user1\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"randur.duran@volenday.com\",\"dateAdded\":\"2018-10-04T07:59:28.000Z\",\"dateUpdated\":\"2018-10-04T08:58:02.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 09:31:01.000','2018-10-15 21:22:37.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (14,'9ShS3HRSZPutmzLw13RtwywsW3MuqVrBNhSUUBLRXfUw',11,'{\"id\":11,\"firstName\":\"Ivan\",\"lastName\":\"Pintor\",\"phoneNumber\":\"1234\",\"companyId\":null,\"username\":\"ivan.admin\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"ivan.pintor@mobbizsolutions.com\",\"dateAdded\":\"2018-09-03T02:38:08.000Z\",\"dateUpdated\":\"2018-09-19T17:02:35.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 11:13:11.000','2018-10-15 20:55:17.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (15,'6Yakxo74voXhQd4mq8oWSRRkYDTBvVbwnpj2HMR7LXW9',8,'{\"id\":8,\"firstName\":\"Standard\",\"lastName\":\"User2\",\"phoneNumber\":\"099999999\",\"companyId\":null,\"username\":\"test.user2\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"test.user2@gmail.com\",\"dateAdded\":\"2018-08-18T02:19:45.000Z\",\"dateUpdated\":\"2018-08-21T07:33:23.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 11:15:04.000','2018-10-15 19:24:29.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (16,'G5499EPEPdCn49gb4dPCioQoUSnvAQwhzbUhduYJ7tbp',7,'{\"id\":7,\"firstName\":\"Randur\",\"lastName\":\"Duran\",\"phoneNumber\":\"0999999999\",\"companyId\":null,\"username\":\"randur.duran\",\"userType\":\"External\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"randurduran@volenday.com\",\"dateAdded\":\"2018-08-14T16:11:43.000Z\",\"dateUpdated\":\"2018-08-14T16:12:00.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":\"DevOps\",\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 11:15:32.000','2018-10-15 20:58:18.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (17,'9FkJZF58YVfgoVCaqGmubRP91At6uUT8CC3yggGv1swU',22,'{\"id\":22,\"firstName\":\"Borja\",\"lastName\":\"Manager(int)\",\"phoneNumber\":\"123456\",\"companyId\":null,\"username\":\"BorjaManager(int)\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"BorjaManager@g.com\",\"dateAdded\":\"2018-09-04T19:38:04.000Z\",\"dateUpdated\":\"2018-09-04T19:51:17.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 11:15:43.000','2018-10-15 21:00:38.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (21,'2PxT5iakrHkGAA2QcZPVDVicNZkxw7qnwGJrGEN2yD2r',6,'{\"id\":6,\"firstName\":\"test\",\"lastName\":\"admin\",\"phoneNumber\":\"6060\",\"companyId\":null,\"username\":\"admin\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"testadmin@cfo.com\",\"dateAdded\":\"2018-08-06T17:18:24.000Z\",\"dateUpdated\":\"2018-08-07T01:19:09.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 13:26:41.000','2018-10-16 10:30:12.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (22,'HcQEK2i4VgRAxtMuBwDNaU1uzPQk3Mauvajbxk3Ndehm',40,'{\"id\":40,\"firstName\":\"randur.manager1\",\"lastName\":\"manager1\",\"phoneNumber\":\"0890890890\",\"companyId\":null,\"username\":\"randur.external.manager1\",\"userType\":\"External\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"randur.duran@volenday.com\",\"dateAdded\":\"2018-10-04T16:02:11.000Z\",\"dateUpdated\":\"2018-10-04T16:02:45.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-15 13:25:29.000','2018-10-15 21:25:44.000');
INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (23,'FXXMPsiPHjgXE7DN78dHi8WUFHWgEwV2fs3sG6AfzKfg',1,'{\"id\":1,\"firstName\":\"John Aldrin1\",\"lastName\":\"Tapia1\",\"phoneNumber\":\"1111\",\"companyId\":null,\"username\":\"master.admin\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png\",\"emailAddress\":\"johnaldrin.tapia@volenday.com\",\"dateAdded\":\"2018-07-25T00:44:35.000Z\",\"dateUpdated\":\"2018-08-22T09:26:53.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"company_id\":null,\"company_companyName\":null,\"company_industry\":null,\"company_isActive\":null,\"company_dateAdded\":null,\"company_dateUpdated\":null}',NULL,'2018-10-16 11:21:18.000','2018-10-23 17:17:46.000');









INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`isActive`,`isDeleted`,`approvalRequired`,`approverId`,`approvalDueDate`,`dateAdded`,`dateUpdated`) VALUES (12,4,'period','description',4,'2018-10-29 16:00:00.000','2018-10-23 16:00:00.000',NULL,NULL,1,'days',4,3,NULL,1,0,0,NULL,NULL,'2018-10-19 16:15:08.000','2018-09-24 00:15:08.000');
INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`isActive`,`isDeleted`,`approvalRequired`,`approverId`,`approvalDueDate`,`dateAdded`,`dateUpdated`) VALUES (13,4,'period','description',4,'2018-11-02 16:00:00.000','2018-10-27 16:00:00.000',NULL,NULL,1,'days',4,3,12,1,0,0,NULL,NULL,'2018-10-19 16:15:08.000','2018-09-24 00:15:08.000');
INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`isActive`,`isDeleted`,`approvalRequired`,`approverId`,`approvalDueDate`,`dateAdded`,`dateUpdated`) VALUES (14,4,'period','description',4,'2018-11-06 16:00:00.000','2018-10-31 16:00:00.000',NULL,NULL,1,'days',4,3,12,1,0,0,NULL,NULL,'2018-10-19 16:15:08.000','2018-09-24 00:15:08.000');

INSERT INTO `task_checklist` (`id`,`isCompleted`,`isDocument`,`isMandatory`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (53,0,1,1,'teste',13,NULL,NULL,1,'2018-10-22 05:20:44.000','2018-10-22 13:20:44.000');
INSERT INTO `task_checklist` (`id`,`isCompleted`,`isDocument`,`isMandatory`,`description`,`taskId`,`periodChecklist`,`documents`,`createdBy`,`dateAdded`,`dateUpdated`) VALUES (54,0,1,1,'teste',14,53,'',1,'2018-10-22 05:20:44.000','2018-10-22 13:20:44.000');

INSERT INTO `task_dependency` (`id`,`taskId`,`dependencyType`,`linkTaskId`,`dateAdded`,`dateUpdated`,`isDeleted`) VALUES (1,12,'Preceded by',13,NULL,'2018-10-23 11:06:30.000',0);





INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Client','project','2018-10-09 00:27:59.000','2018-10-09 08:27:59.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','project','2018-10-09 00:27:59.000','2018-10-09 08:27:59.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Private','project','2018-10-09 00:27:59.000','2018-10-09 08:27:59.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Output based','workstream','2018-10-09 00:27:59.000','2018-10-09 08:27:59.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'Time based','workstream','2018-10-09 00:27:59.000','2018-10-09 08:27:59.000',1,0);

INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (1,'John Aldrin1','Tapia1','1111',NULL,'master.admin','c08f94cdbfd13e47333a2d6e18c5ab8b6d2c3fbf','4qVnChLYBUpVWuLXQsZBKQJcYiq5ZVRn','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','johnaldrin.tapia@volenday.com','2018-07-25 08:44:35.000','2018-08-22 17:26:53.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (2,'Aldous','',NULL,NULL,'standard.user2','bfb18fbd5b92f95a22f39f559dfe0fffb9796af3','9yvvVWgkHIqNmrFkyrn1oFQoe7V77X9m','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','Aldoustester@volenday.com','2018-07-28 01:08:53.000','2018-10-03 10:42:43.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (3,'testuser2','volenday','2323',NULL,'standard.user','c7b6586d67a1860743f11898c97462624c207d43','7VvRcUa6uYqKDu6tnY9T3Pvmahub40Dv','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testuser2@volenday.com','2018-07-28 09:19:45.000','2018-07-30 05:07:30.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (5,'Internal','Manager','090937373',NULL,'manager','0d44ef43111199b99bd49942c10968d5378b7bf8','CF7DRHEnFUwX2WhmtbJs0D94Kf4W9qma','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testmanager@cfo.com','2018-08-06 01:14:47.000','2018-08-06 09:18:52.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (6,'test','admin','6060',NULL,'admin','7d90fd6eb269160e01cb466e18e807b76230180b','JwbvRNedPgdTbU4Jw32leTorsHoZ8he0','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','testadmin@cfo.com','2018-08-07 01:18:24.000','2018-08-07 09:19:09.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (7,'Randur','Duran','0999999999',NULL,'randur.duran','f4ce619793537995f507efb5ebf68127c9c0d4f1','YkQGb7hzWSGCtMHoL9gBbFrqIU0jiPz0','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randurduran@volenday.com','2018-08-15 00:11:43.000','2018-08-15 08:12:00.000',1,0,'DevOps');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (8,'Standard','User2','099999999',NULL,'test.user2','c5d605ae120c02ce74946b3691aef166e3bbd3f5','ut5IG2lLZbMx0wHViPk8l25NYY5BQaky','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','test.user2@gmail.com','2018-08-18 10:19:45.000','2018-08-21 23:33:23.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (9,'User','Guest','695932116654',NULL,'user.guest','66ef2bcfe3e396ca04aad34de0b92be59f6cd06f','I55b9DevwFvS7pm0HFLG7YSJNRfwkD6A','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','user.guest@volenday.com','2018-08-29 08:42:00.000','2018-08-29 16:42:50.000',1,0,'Test Company');
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (10,'Aian','Fajardo','24',NULL,'aian.fajardo','dcc0796f98d4f69eb72d8698b4c60e4e35c2361e','4GzyPJs7wwsKrGxpR72R4hE5b9Qfvepr','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','aian.fajardo@volenday.com','2018-09-03 07:54:33.000','2018-09-05 00:35:52.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (11,'Ivan','Pintor','1234',NULL,'ivan.admin','dcfe47947da876c8c3f9f572ba865d8336b2f3af','pCnctAerBf2j31kz4jYtyKYRMlx3ZjBZ','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','ivan.pintor@mobbizsolutions.com','2018-09-03 10:38:08.000','2018-09-20 09:02:35.000',1,0,NULL);
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
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (34,'randur','internal.user1','0890890890',NULL,'randur.internal.user123','f01dbbc8fecda2642db9be6b6c3d26c49539d992','JF8oYWTtCB8tbCQRQGFZEOAESV8sX1cq','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.internal.user1@gmail.com','2018-09-27 00:26:44.000','2018-10-05 08:57:27.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (35,'UX','Team',NULL,NULL,'UXTeam','5e7e73598937494d5a282fab81b72d4cb467b4da','eB7ns3yQHdrzJ1gTnj6xFDWXLU2U8xyz','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','us@team.com','2018-09-28 09:28:00.000','2018-09-28 17:29:10.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (36,'randur.iternal','user1','0890890',NULL,'randur.internal.user1','f8dd88bfb802d433830bae5aee4ff9aacd1c681e','SGsWB6glzWmfzJtOa7A8ssnGW3GGC1YG','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-10-04 15:59:28.000','2018-10-05 00:58:02.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (37,'randur.external','user1','0890890890',NULL,'randur.external.user1','e20e69cfc32f536da01b5a30db261bfb8429114a','v6oLuiGMjYtriS8rJTRvduuEbfbBpiAK','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-10-05 00:00:11.000','2018-10-05 08:02:25.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (38,'randur.admin','internal.admin1','0890890890',NULL,'randur.internal.admin1','df6c294414d364450d432f7df0f15f793fe31877','nDXE9uRgBYB3jjikVIEylLwldQYdaOX3','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-10-04 16:00:59.000','2018-10-05 08:11:04.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (39,'randur.manager1','internal','0890890890',NULL,'randur.internal.manager1','42b0ad6b2006bfd5c78a66c66040fd757d105cb9','2hXXRrfqwRSxjVt0IHUDX4ASq35ao5q6','Internal','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-10-05 00:01:34.000','2018-10-05 08:02:39.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (40,'randur.manager1','manager1','0890890890',NULL,'randur.external.manager1','c9d431bf5173666241fa1a24d8254f619f7609d3','G8VenBIBvYNLqXumYaWCwoIi1zrsFgrD','External','https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png','randur.duran@volenday.com','2018-10-05 00:02:11.000','2018-10-05 08:02:45.000',1,0,NULL);

INSERT INTO `users_forgot_password` (`id`,`usersId`,`hash`,`dateAdded`,`dateUpdated`) VALUES (1,'1',NULL,'2018-09-18 00:45:05.000','2018-09-18 08:45:05.000');

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
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (93,7,5,'2018-09-10 07:59:08.000','2018-09-10 15:59:08.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (94,33,6,'2018-09-12 09:02:42.000','2018-09-12 17:02:42.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (96,35,2,'2018-09-28 09:28:00.000','2018-09-28 17:28:00.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (98,37,6,'2018-10-05 00:00:11.000','2018-10-05 08:00:11.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (100,39,3,'2018-10-05 00:01:34.000','2018-10-05 08:01:34.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (101,40,5,'2018-10-05 00:02:11.000','2018-10-05 08:02:11.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (102,38,2,'2018-10-05 00:10:55.000','2018-10-05 08:10:55.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (103,34,4,'2018-10-05 00:54:21.000','2018-10-05 08:54:21.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (104,36,4,'2018-10-05 00:58:38.000','2018-10-05 08:58:38.000',1,0);



INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,1,'Workstream 1',NULL,NULL,0,NULL,4,'2018-10-14 17:21:03.000','2018-10-15 01:21:03.000',1,0);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,2,'Software Development',NULL,'Software development is the process of conceiving, specifying, designing, programming, documenting, testing, and bug fixing involved in creating and maintaining applications, frameworks, or other software components.',0,NULL,4,'2018-10-14 17:24:22.000','2018-10-15 01:24:22.000',1,0);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,3,'PAYROLL',NULL,NULL,0,NULL,4,'2018-10-14 19:14:22.000','2018-10-15 03:14:22.000',1,0);
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`projectDescription`,`numberOfHours`,`statusId`,`typeId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,4,'Software Development',NULL,'Software development is the process of conceiving, specifying, designing, programming, documenting, testing, and bug fixing involved in creating and maintaining applications, frameworks, or other software components.',0,NULL,4,'2018-10-15 23:11:56.000','2018-10-15 23:11:56.000',1,0);