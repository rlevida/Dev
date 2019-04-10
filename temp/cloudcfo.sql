DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','checklist','document','member') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `actionType` enum('created','modified','deleted','added','completed') COLLATE utf8mb4_bin DEFAULT NULL,
  `old` text COLLATE utf8mb4_bin,
  `new` text COLLATE utf8mb4_bin,
  `title` text COLLATE utf8mb4_bin,
  `notes` text COLLATE utf8mb4_bin,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `activity_logs_document`;
CREATE TABLE IF NOT EXISTS `activity_logs_document` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','checklist','document','member') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `projectId` bigint(20) DEFAULT NULL,
  `actionType` enum('created','modified','deleted','added','moved','shared','starred','duplicated') COLLATE utf8mb4_bin DEFAULT NULL,
  `old` text COLLATE utf8mb4_bin,
  `new` text COLLATE utf8mb4_bin,
  `title` text COLLATE utf8mb4_bin,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `checklist_documents`;
CREATE TABLE IF NOT EXISTS `checklist_documents` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` bigint(20) DEFAULT NULL,
  `documentId` bigint(20) DEFAULT NULL,
  `checklistId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `company`;
CREATE TABLE IF NOT EXISTS `company` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `companyName` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `industry` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `conversation`;
CREATE TABLE IF NOT EXISTS `conversation` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `comment` text COLLATE utf8mb4_bin,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','document','notes') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `status` bigint(20) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `isArchived` tinyint(1) DEFAULT '0',
  `documentNameCount` int(11) NOT NULL DEFAULT '0',
  `attachmentId` int(11) NOT NULL DEFAULT '0',
  `readOn` datetime DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `document_link`;
CREATE TABLE IF NOT EXISTS `document_link` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `documentId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `document_read`;
CREATE TABLE IF NOT EXISTS `document_read` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `documentId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `folder`;
CREATE TABLE IF NOT EXISTS `folder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` text COLLATE utf8mb4_bin,
  `projectId` bigint(20) DEFAULT NULL,
  `parentId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `isFolder` tinyint(1) DEFAULT '1',
  `type` enum('new','library','archived') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `ip_block`;
CREATE TABLE IF NOT EXISTS `ip_block` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ipAddress` varchar(30) COLLATE utf8mb4_bin DEFAULT NULL,
  `failedTimes` int(2) DEFAULT NULL,
  `dateFailed` datetime DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `memberType` enum('assignedTo','Follower','responsible','project manager','approver') COLLATE utf8mb4_bin DEFAULT NULL,
  `receiveNotification` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `workstreamId` bigint(20) DEFAULT NULL,
  `note` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `privacyType` enum('Private','Public') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(4) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `notes_last_seen`;
CREATE TABLE IF NOT EXISTS `notes_last_seen` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `linkType` enum('notes','conversation') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `userId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `projectId` bigint(20) DEFAULT NULL,
  `workstreamId` bigint(20) DEFAULT NULL,
  `taskId` bigint(20) DEFAULT NULL,
  `documentId` bigint(20) DEFAULT NULL,
  `message` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` tinyint(4) DEFAULT '1',
  `isRead` tinyint(4) DEFAULT '0',
  `type` enum('taskAssigned','taskTagged','fileNewUpload','messageSend','commentReplies','taskDeadline','taskMemberCompleted','taskFollowingCompleted','taskTeamDeadline','taskFollowingDeadline') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(4) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `remindOnDuedate` tinyint(1) DEFAULT '0',
  `remindBeforeDuedate` tinyint(1) DEFAULT '0',
  `color` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `reminder`;
CREATE TABLE IF NOT EXISTS `reminder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `detail` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT '0',
  `projectId` bigint(20) DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `linkType` enum('task','document','workstream','notes') COLLATE utf8mb4_bin DEFAULT NULL,
  `type` enum('Task For Approval','Task Rejected','Task Overdue','Task Due Today','Tag in Comment','Task Completed','Send Message') COLLATE utf8mb4_bin DEFAULT NULL,
  `createdBy` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `starred`;
CREATE TABLE IF NOT EXISTS `starred` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `linkType` enum('project','workstream','task','document','conversation','notes') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `tag`;
CREATE TABLE IF NOT EXISTS `tag` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `indicator` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `linkType` enum('user','workstream','task','conversation','document','others','notes') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkId` bigint(20) DEFAULT NULL,
  `tagType` enum('user','workstream','task','conversation','document','folder','notes') COLLATE utf8mb4_bin DEFAULT NULL,
  `tagTypeId` bigint(20) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `isCompleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task`;
CREATE TABLE IF NOT EXISTS `task` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `projectId` bigint(20) DEFAULT NULL,
  `task` text COLLATE utf8mb4_bin,
  `description` text COLLATE utf8mb4_bin,
  `workstreamId` bigint(20) DEFAULT NULL,
  `dueDate` datetime DEFAULT NULL,
  `startDate` datetime DEFAULT NULL,
  `status` enum('In Progress','For Approval','Completed','Rejected') COLLATE utf8mb4_bin DEFAULT NULL,
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
  `dateCompleted` datetime DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_checklist`;
CREATE TABLE IF NOT EXISTS `task_checklist` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_bin,
  `isCompleted` tinyint(1) DEFAULT '0',
  `isDocument` tinyint(1) DEFAULT '0',
  `isMandatory` tinyint(1) DEFAULT '0',
  `taskId` bigint(20) DEFAULT NULL,
  `periodChecklist` bigint(20) DEFAULT NULL,
  `documents` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdBy` int(11) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_dependency`;
CREATE TABLE IF NOT EXISTS `task_dependency` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` bigint(20) DEFAULT NULL,
  `dependencyType` enum('Preceded by','Succeeding') COLLATE utf8mb4_bin DEFAULT NULL,
  `linkTaskId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `isDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_member_reminder`;
CREATE TABLE IF NOT EXISTS `task_member_reminder` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `taskId` bigint(20) DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `defaultNotification` tinyint(1) DEFAULT '1',
  `emailNotification` tinyint(1) DEFAULT '1',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `task_time_logs`;
CREATE TABLE IF NOT EXISTS `task_time_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `time` float DEFAULT NULL,
  `period` enum('days','weeks','hours','minutes') COLLATE utf8mb4_bin DEFAULT NULL,
  `description` text COLLATE utf8mb4_bin,
  `taskId` bigint(20) DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `team`;
CREATE TABLE IF NOT EXISTS `team` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `team` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `usersId` bigint(20) DEFAULT NULL,
  `teamLeaderId` bigint(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_forgot_password`;
CREATE TABLE IF NOT EXISTS `users_forgot_password` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL,
  `hash` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

DROP TABLE IF EXISTS `users_notification_setting`;
CREATE TABLE IF NOT EXISTS `users_notification_setting` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `usersId` bigint(20) DEFAULT NULL,
  `taskAssigned` tinyint(1) DEFAULT '1',
  `taskTagged` tinyint(1) DEFAULT '1',
  `fileNewUpload` tinyint(1) DEFAULT '1',
  `messageSend` tinyint(1) DEFAULT '1',
  `commentReplies` tinyint(1) DEFAULT '1',
  `taskDeadline` tinyint(1) DEFAULT '1',
  `taskMemberCompleted` tinyint(1) DEFAULT '1',
  `taskFollowingCompleted` tinyint(1) DEFAULT '1',
  `taskTeamDeadline` tinyint(1) DEFAULT '1',
  `taskFollowingDeadline` tinyint(1) DEFAULT '1',
  `receiveEmail` tinyint(1) DEFAULT '1',
  `dateAdded` datetime DEFAULT NULL,
  `dateUpdated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

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
  `description` text COLLATE utf8mb4_bin,
  `numberOfHours` bigint(20) DEFAULT NULL,
  `statusId` bigint(20) DEFAULT NULL,
  `typeId` bigint(20) DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_bin DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `isTemplate` tinyint(1) DEFAULT '0',
  `isDeleted` tinyint(1) DEFAULT '0',
  `dateAdded` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dateUpdated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`title`,`notes`,`dateAdded`,`dateUpdated`) VALUES (1,1,'task',1,'created',NULL,'{\"task\":{\"periodic\":\"0\",\"isActive\":\"1\",\"isDeleted\":\"0\",\"approvalRequired\":\"0\",\"id\":1,\"projectId\":1,\"workstreamId\":1,\"approverId\":\"\",\"startDate\":null,\"dueDate\":\"2019-03-31T16:00:00.000Z\",\"task\":\"task 1\",\"period\":0,\"periodInstance\":0,\"status\":\"In Progress\"}}','task 1',NULL,'2019-04-04 14:34:00.000','2019-04-04 22:34:00.000');
INSERT INTO `activity_logs` (`id`,`usersId`,`linkType`,`linkId`,`actionType`,`old`,`new`,`title`,`notes`,`dateAdded`,`dateUpdated`) VALUES (2,1,'task',2,'created',NULL,'{\"task\":{\"periodic\":\"0\",\"isActive\":\"1\",\"isDeleted\":\"0\",\"approvalRequired\":\"0\",\"id\":2,\"task\":\"Task 2\",\"projectId\":1,\"workstreamId\":1,\"approverId\":\"\",\"dueDate\":\"2019-03-31T16:00:00.000Z\",\"period\":0,\"periodInstance\":0,\"status\":\"In Progress\",\"startDate\":null}}','Task 2',NULL,'2019-04-04 15:13:53.000','2019-04-04 23:13:53.000');

INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (1,1,'document',1,1,'created','','1.png.png','Document uploaded','2019-04-04 07:48:21.000','2019-04-04 15:48:21.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (2,1,'document',2,1,'created','','1.png (3).png','Document uploaded','2019-04-04 07:49:00.000','2019-04-04 15:49:00.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (3,1,'document',3,1,'created','','1.png (1) (1).png','Document uploaded','2019-04-04 07:51:20.000','2019-04-04 15:51:20.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (4,1,'document',3,1,'starred','1.png (1) (1).png','','Starred document','2019-04-04 13:35:44.000','2019-04-04 21:35:44.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (5,1,'document',3,1,'starred','1.png (1) (1).png','','Unstarred document','2019-04-04 13:36:23.000','2019-04-04 21:36:23.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (6,1,'document',3,1,'starred','1.png (1) (1).png','','Unstarred document','2019-04-04 13:38:29.000','2019-04-04 21:38:29.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (7,1,'document',4,1,'created','','1.png','Document uploaded','2019-04-04 13:48:23.000','2019-04-04 21:48:23.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (8,1,'document',5,1,'created','','1.png (1).png','Document uploaded','2019-04-04 13:49:01.000','2019-04-04 21:49:01.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (9,1,'document',6,1,'created','','1.png (1) (1).png','Document uploaded','2019-04-04 13:57:51.000','2019-04-04 21:57:51.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (10,1,'document',7,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 13:58:20.000','2019-04-04 21:58:20.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (11,1,'document',8,1,'created','','1.png (2).png','Document uploaded','2019-04-04 13:59:24.000','2019-04-04 21:59:24.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (12,1,'document',9,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 14:02:08.000','2019-04-04 22:02:08.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (13,1,'document',10,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:02:44.000','2019-04-04 22:02:44.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (14,1,'document',12,1,'created','','1.png (1).png','Document uploaded','2019-04-04 14:12:11.000','2019-04-04 22:12:11.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (15,1,'document',13,1,'created','','1.png.png','Document uploaded','2019-04-04 14:13:24.000','2019-04-04 22:13:24.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (16,1,'document',14,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:14:17.000','2019-04-04 22:14:17.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (17,1,'document',15,1,'created','','1.png (1) (1).png','Document uploaded','2019-04-04 14:14:58.000','2019-04-04 22:14:58.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (18,1,'document',16,1,'created','','1.png (2).png','Document uploaded','2019-04-04 14:15:37.000','2019-04-04 22:15:37.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (19,1,'document',17,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:16:33.000','2019-04-04 22:16:33.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (20,1,'document',18,1,'created','','1.png (3).png','Document uploaded','2019-04-04 14:21:32.000','2019-04-04 22:21:32.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (21,1,'document',19,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:22:31.000','2019-04-04 22:22:31.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (22,1,'document',20,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:28:15.000','2019-04-04 22:28:15.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (23,1,'document',21,1,'created','','1.png (1) (1).png','Document uploaded','2019-04-04 14:40:09.000','2019-04-04 22:40:09.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (24,1,'document',22,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 14:42:10.000','2019-04-04 22:42:10.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (25,1,'document',23,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 14:43:24.000','2019-04-04 22:43:24.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (26,1,'document',24,1,'created','','1.png.png','Document uploaded','2019-04-04 14:44:59.000','2019-04-04 22:44:59.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (27,1,'document',25,1,'created','','1.png (3).png','Document uploaded','2019-04-04 14:50:07.000','2019-04-04 22:50:07.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (28,1,'document',26,1,'created','','1.png (5).png','Document uploaded','2019-04-04 14:51:08.000','2019-04-04 22:51:08.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (29,1,'document',27,1,'created','','1.png (2).png','Document uploaded','2019-04-04 14:57:26.000','2019-04-04 22:57:26.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (30,1,'document',28,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 14:58:05.000','2019-04-04 22:58:05.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (31,1,'document',29,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 15:00:05.000','2019-04-04 23:00:05.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (32,1,'document',30,1,'created','','1.png (2) (1).png','Document uploaded','2019-04-04 15:02:47.000','2019-04-04 23:02:47.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (33,1,'document',31,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 15:03:28.000','2019-04-04 23:03:28.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (34,1,'document',32,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 15:06:27.000','2019-04-04 23:06:27.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (35,1,'document',33,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 15:08:27.000','2019-04-04 23:08:27.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (36,1,'document',34,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 15:09:17.000','2019-04-04 23:09:17.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (37,1,'document',35,1,'created','','1.png (3) (1).png','Document uploaded','2019-04-04 15:09:32.000','2019-04-04 23:09:32.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (38,1,'document',36,1,'created','','1.png (3).png','Document uploaded','2019-04-04 15:10:36.000','2019-04-04 23:10:36.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (39,1,'document',37,1,'created','','1.png (1) (1).png','Document uploaded','2019-04-04 15:14:13.000','2019-04-04 23:14:13.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (40,1,'document',38,1,'created','','1.png (2).png','Document uploaded','2019-04-04 15:15:17.000','2019-04-04 23:15:17.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (41,1,'document',39,1,'created','','1.png (2).png','Document uploaded','2019-04-04 15:16:25.000','2019-04-04 23:16:25.000');
INSERT INTO `activity_logs_document` (`id`,`usersId`,`linkType`,`linkId`,`projectId`,`actionType`,`old`,`new`,`title`,`dateAdded`,`dateUpdated`) VALUES (42,1,'document',40,1,'created','','1.png (2).png','Document uploaded','2019-04-04 15:18:25.000','2019-04-04 23:18:25.000');







INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (1,'5249854f2414cab04fdbee7cf8aef97c19a9e87e1.png.png','1.png.png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 07:48:21.000','2019-04-04 15:48:21.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (2,'191b98d4e565574badeebdf5d97646531a251a6a1.png__3_.png','1.png (3).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 07:49:00.000','2019-04-04 15:49:00.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (3,'dda010e56f8d37a0e964aee1e3f08995f19de0bd1.png__1___1_.png','1.png (1) (1).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 07:51:20.000','2019-04-04 15:51:20.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (4,'e96b71c4c38c1185d1a6b7e5c11876d639c8e6b51.png','1.png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 13:48:23.000','2019-04-04 21:48:23.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (5,'cc953389fd18ce8e08d8746ee90f350a1ecdc81c1.png__1_.png','1.png (1).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 13:49:01.000','2019-04-04 21:49:01.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (6,'3b4dbe28b875d8b3c34ce551ed26f4cb998b38a11.png__1___1_.png','1.png (1) (1).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 13:57:51.000','2019-04-04 21:57:51.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (7,'e5266ade813c64f4c567add4c34abdb9ebb6d40f1.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 13:58:20.000','2019-04-04 21:58:20.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (8,'2a0a2c386556fb1524ad9c853175fc2c34c27a6d1.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 13:59:24.000','2019-04-04 21:59:24.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (9,'6fc6be78378123aba24d846531d5199c724bb2071.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 14:02:08.000','2019-04-04 22:02:08.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (10,'102ed97c1dedc21e7b0d107bebbcff629c6a85871.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:02:44.000','2019-04-04 22:02:44.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (11,'463dbd72bba415929d2c13e13aeaa631495790cf1.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:04:37.000','2019-04-04 22:04:37.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (12,'2854720e7ec87943bccd6018bd22b98062017b4e1.png__1_.png','1.png (1).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:12:11.000','2019-04-04 22:12:11.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (13,'9e9ab70a360ea8e61e71ab31d255e0dafedf7dc51.png.png','1.png.png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:13:24.000','2019-04-04 22:13:24.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (14,'a428c4f3748058f497227a8ac4f17da8c1b4e5311.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,3,0,NULL,'2019-04-04 14:14:17.000','2019-04-04 22:14:17.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (15,'43ddd5ff7d613b774c21b914af88f2be67e83cf61.png__1___1_.png','1.png (1) (1).png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:14:58.000','2019-04-04 22:14:58.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (16,'ccdb719557f39607f9a6f9624b16c4620f6f8eb41.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:15:37.000','2019-04-04 22:15:37.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (17,'c9e23936d56008d342dd9a5499692d4df3495a5d1.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,4,0,NULL,'2019-04-04 14:16:33.000','2019-04-04 22:16:33.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (18,'7afbb1ab7d0988752913ab2347f44e6ccf026f331.png__3_.png','1.png (3).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:21:32.000','2019-04-04 22:21:32.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (19,'ed419f6d3c60b8acd36fba3248b9c8ed8beec71a1.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,5,0,NULL,'2019-04-04 14:22:31.000','2019-04-04 22:22:31.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (20,'be48afd6775cbc09897761a8578cbeeae2bcbce81.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,6,0,NULL,'2019-04-04 14:28:15.000','2019-04-04 22:28:15.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (21,'fca40987e91534e5991eb9b12b729092c0fde53a1.png__1___1_.png','1.png (1) (1).png',1,'document',NULL,0,'new',0,0,3,0,NULL,'2019-04-04 14:40:09.000','2019-04-04 22:40:09.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (22,'9859566c58d0f9bfe86e1b34638b48dd4f6f43ca1.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,1,0,NULL,'2019-04-04 14:42:10.000','2019-04-04 22:42:10.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (23,'427476e7b6c9426669c1bc69c006b13324a4b03c1.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:43:24.000','2019-04-04 22:43:24.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (24,'4e33dd30f28676df1ec740112e74d1dc3da4fb811.png.png','1.png.png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:44:59.000','2019-04-04 22:44:59.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (25,'aaba964459a39c91e39253d3e2d186b49ccaf6b81.png__3_.png','1.png (3).png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:50:07.000','2019-04-04 22:50:07.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (26,'0777cd10d9144bc9f28dbe250d6a270a4af5620d1.png__5_.png','1.png (5).png',1,'document',NULL,0,'new',0,0,0,0,NULL,'2019-04-04 14:51:08.000','2019-04-04 22:51:08.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (27,'7ad659fdf45aa313852dbea0cab15b3ba1e63cb61.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,2,0,NULL,'2019-04-04 14:57:26.000','2019-04-04 22:57:26.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (28,'67e33b0fec32cc990ac717447e5beb919a6557131.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,7,0,NULL,'2019-04-04 14:58:05.000','2019-04-04 22:58:05.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (29,'67e33b0fec32cc990ac717447e5beb919a6557131.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,8,0,NULL,'2019-04-04 15:00:05.000','2019-04-04 23:00:05.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (30,'c8bd5484d0eff506407cca9a4878730e3ad8934a1.png__2___1_.png','1.png (2) (1).png',1,'document',NULL,0,'new',0,0,9,0,NULL,'2019-04-04 15:02:47.000','2019-04-04 23:02:47.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (31,'353cc8fc5546c5e10c5153f98f0e2c81d69c44d81.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,3,0,NULL,'2019-04-04 15:03:28.000','2019-04-04 23:03:28.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (32,'cee7540ee777cbf2f42f750817e88bcf7d54826e1.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,4,0,NULL,'2019-04-04 15:06:27.000','2019-04-04 23:06:27.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (33,'cee7540ee777cbf2f42f750817e88bcf7d54826e1.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,5,0,NULL,'2019-04-04 15:08:27.000','2019-04-04 23:08:27.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (34,'63eec145b28d476f926a4e1ba20c76f795dd50c81.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,6,0,NULL,'2019-04-04 15:09:17.000','2019-04-04 23:09:17.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (35,'63eec145b28d476f926a4e1ba20c76f795dd50c81.png__3___1_.png','1.png (3) (1).png',1,'document',NULL,0,'new',0,0,7,0,NULL,'2019-04-04 15:09:32.000','2019-04-04 23:09:32.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (36,'ca5429c2520ad250f0a4542403612a7427ed29a91.png__3_.png','1.png (3).png',1,'document',NULL,0,'new',0,0,3,0,NULL,'2019-04-04 15:10:36.000','2019-04-04 23:10:36.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (37,'1e1e2147ca1cf11562e9ec785875eeb2abe9d0641.png__1___1_.png','1.png (1) (1).png',1,'document',NULL,0,'new',0,0,4,0,NULL,'2019-04-04 15:14:13.000','2019-04-04 23:14:13.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (38,'3518fc20db28783df35a162804f0d78c05415d0e1.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,3,0,NULL,'2019-04-04 15:15:17.000','2019-04-04 23:15:17.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (39,'d22e465210be8191ce2fa7316f0c7d3bc53eafe01.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,4,0,NULL,'2019-04-04 15:16:25.000','2019-04-04 23:16:25.000');
INSERT INTO `document` (`id`,`name`,`origin`,`uploadedBy`,`type`,`folderId`,`isDeleted`,`status`,`isCompleted`,`isArchived`,`documentNameCount`,`attachmentId`,`readOn`,`dateAdded`,`dateUpdated`) VALUES (40,'d22e465210be8191ce2fa7316f0c7d3bc53eafe01.png__2_.png','1.png (2).png',1,'document',NULL,0,'new',0,0,5,0,NULL,'2019-04-04 15:18:25.000','2019-04-04 23:18:25.000');

INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (1,1,'project',1,'2019-04-04 07:48:21.000','2019-04-04 15:48:21.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (2,2,'project',1,'2019-04-04 07:49:00.000','2019-04-04 15:49:00.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (3,3,'project',1,'2019-04-04 07:51:20.000','2019-04-04 15:51:20.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (4,4,'project',1,'2019-04-04 13:48:23.000','2019-04-04 21:48:23.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (5,5,'project',1,'2019-04-04 13:49:01.000','2019-04-04 21:49:01.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (6,6,'project',1,'2019-04-04 13:57:51.000','2019-04-04 21:57:51.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (7,7,'project',1,'2019-04-04 13:58:20.000','2019-04-04 21:58:20.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (8,8,'project',1,'2019-04-04 13:59:24.000','2019-04-04 21:59:24.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (9,9,'project',1,'2019-04-04 14:02:08.000','2019-04-04 22:02:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (10,10,'project',1,'2019-04-04 14:02:44.000','2019-04-04 22:02:44.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (11,12,'project',1,'2019-04-04 14:12:11.000','2019-04-04 22:12:11.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (12,13,'project',1,'2019-04-04 14:13:24.000','2019-04-04 22:13:24.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (13,14,'project',1,'2019-04-04 14:14:17.000','2019-04-04 22:14:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (14,15,'project',1,'2019-04-04 14:14:58.000','2019-04-04 22:14:58.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (15,16,'project',1,'2019-04-04 14:15:37.000','2019-04-04 22:15:37.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (16,17,'project',1,'2019-04-04 14:16:33.000','2019-04-04 22:16:33.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (17,18,'project',1,'2019-04-04 14:21:32.000','2019-04-04 22:21:32.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (18,19,'project',1,'2019-04-04 14:22:31.000','2019-04-04 22:22:31.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (19,20,'project',1,'2019-04-04 14:28:15.000','2019-04-04 22:28:15.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (20,21,'project',1,'2019-04-04 14:40:09.000','2019-04-04 22:40:09.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (21,22,'project',1,'2019-04-04 14:42:10.000','2019-04-04 22:42:10.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (22,23,'project',1,'2019-04-04 14:43:24.000','2019-04-04 22:43:24.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (23,24,'project',1,'2019-04-04 14:44:59.000','2019-04-04 22:44:59.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (24,25,'project',1,'2019-04-04 14:50:07.000','2019-04-04 22:50:07.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (25,26,'project',1,'2019-04-04 14:51:08.000','2019-04-04 22:51:08.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (26,27,'project',1,'2019-04-04 14:57:26.000','2019-04-04 22:57:26.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (27,28,'project',1,'2019-04-04 14:58:05.000','2019-04-04 22:58:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (28,29,'project',1,'2019-04-04 15:00:05.000','2019-04-04 23:00:05.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (29,30,'project',1,'2019-04-04 15:02:47.000','2019-04-04 23:02:47.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (30,31,'project',1,'2019-04-04 15:03:28.000','2019-04-04 23:03:28.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (31,32,'project',1,'2019-04-04 15:06:27.000','2019-04-04 23:06:27.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (32,33,'project',1,'2019-04-04 15:08:27.000','2019-04-04 23:08:27.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (33,34,'project',1,'2019-04-04 15:09:17.000','2019-04-04 23:09:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (34,35,'project',1,'2019-04-04 15:09:32.000','2019-04-04 23:09:32.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (35,36,'project',1,'2019-04-04 15:10:36.000','2019-04-04 23:10:36.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (36,37,'project',1,'2019-04-04 15:14:13.000','2019-04-04 23:14:13.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (37,38,'project',1,'2019-04-04 15:15:17.000','2019-04-04 23:15:17.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (38,39,'project',1,'2019-04-04 15:16:25.000','2019-04-04 23:16:25.000');
INSERT INTO `document_link` (`id`,`documentId`,`linkType`,`linkId`,`dateAdded`,`dateUpdated`) VALUES (39,40,'project',1,'2019-04-04 15:18:25.000','2019-04-04 23:18:25.000');

INSERT INTO `document_read` (`id`,`usersId`,`documentId`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (1,1,3,0,'2019-04-04 13:35:42.000','2019-04-04 21:35:42.000');





INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (1,'users',1,'project',1,'project manager',1,0,'2019-04-04 06:45:55.000','2019-04-04 14:45:55.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (2,'users',2,'project',1,'assignedTo',1,0,'2019-04-04 13:50:36.000','2019-04-04 21:50:36.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (3,'users',2,'workstream',1,'responsible',1,0,'2019-04-04 13:51:03.000','2019-04-04 21:51:03.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (4,'users',3,'project',1,'assignedTo',1,0,'2019-04-04 14:29:41.000','2019-04-04 22:29:41.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (5,'users',3,'task',1,'assignedTo',1,0,'2019-04-04 14:34:00.000','2019-04-04 22:34:00.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (6,'users',4,'project',1,'assignedTo',1,0,'2019-04-04 15:13:22.000','2019-04-04 23:13:22.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (7,'users',4,'task',2,'assignedTo',1,0,'2019-04-04 15:13:53.000','2019-04-04 23:13:53.000');
INSERT INTO `members` (`id`,`usersType`,`userTypeLinkId`,`linkType`,`linkId`,`memberType`,`receiveNotification`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (8,'users',2,'workstream',2,'responsible',1,0,'2019-04-04 15:14:50.000','2019-04-04 23:14:50.000');







INSERT INTO `project` (`id`,`project`,`statusId`,`typeId`,`projectType`,`tinNo`,`companyAddress`,`classification`,`projectNameCount`,`createdBy`,`isActive`,`isDeleted`,`remindOnDuedate`,`remindBeforeDuedate`,`color`,`dateAdded`,`dateUpdated`) VALUES (1,'Project 1',NULL,1,NULL,NULL,NULL,NULL,0,1,1,0,0,0,'#82b2d1','2019-04-04 06:45:55.000','2019-04-04 15:14:50.000');



INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Internal','Master Admin','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','Admin','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Internal','Manager','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Internal','Staff','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'External','Manager Guest','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);
INSERT INTO `role` (`id`,`roleType`,`role`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (6,'External','User Guest','2019-04-04 14:44:27.000','2019-04-04 14:44:27.000',1,0);

INSERT INTO `session` (`id`,`session`,`usersId`,`data`,`expiredDate`,`dateAdded`,`dateUpdated`) VALUES (4,'1zfyqwRJcLwFPpQvcjAfVgL5raB4UzLQYhWT2Tf59ZtU',2,'{\"id\":2,\"firstName\":\"internal.user1\",\"lastName\":\"internal.user1\",\"phoneNumber\":null,\"companyId\":null,\"username\":\"internal.user1\",\"userType\":\"Internal\",\"avatar\":\"https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png\",\"emailAddress\":\"internal.user1@gmail.com\",\"dateAdded\":null,\"dateUpdated\":\"2019-04-04T05:50:07.000Z\",\"isActive\":1,\"isDeleted\":0,\"company\":null,\"user_role\":[{\"id\":3,\"usersId\":2,\"roleId\":4,\"dateAdded\":null,\"dateUpdated\":\"2019-04-04T05:49:55.000Z\",\"isActive\":1,\"isDeleted\":0,\"role\":{\"id\":4,\"roleType\":\"Internal\",\"role\":\"Staff\",\"dateAdded\":\"2019-04-04T14:44:27.000Z\",\"dateUpdated\":\"2019-04-03T22:44:27.000Z\",\"isActive\":1,\"isDeleted\":0}}],\"projectId\":[1],\"user_projects\":[{\"id\":2,\"usersType\":\"users\",\"userTypeLinkId\":2,\"linkType\":\"project\",\"linkId\":1,\"memberType\":\"assignedTo\",\"receiveNotification\":1,\"isDeleted\":0,\"dateAdded\":\"2019-04-04T13:50:36.000Z\",\"dateUpdated\":\"2019-04-04T05:50:36.000Z\"}],\"userRole\":4,\"team\":[]}',NULL,'2019-04-04 15:22:54.000','2019-04-04 23:59:59.000');



INSERT INTO `starred` (`id`,`usersId`,`linkType`,`linkId`,`isActive`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (1,1,'document',3,1,0,'2019-04-04 13:35:44.000','2019-04-04 21:38:29.000');

INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Active','project','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'On-track','project','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Issues','project','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Active','workstream','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'On-time','workstream','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (6,'Inactive','workstream','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (7,'Issues','workstream','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (8,'Active','task','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (9,'Inactive','task','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (10,'Due Today','task','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);
INSERT INTO `status` (`id`,`status`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (11,'Issues','task','2019-03-23 12:15:06.000','2019-03-23 12:15:06.000',1,0);

INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (1,NULL,'workstream',1,'document',1,0,0,'2019-04-04 07:48:21.000','2019-04-04 15:48:21.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (2,NULL,'workstream',1,'document',2,0,0,'2019-04-04 07:49:00.000','2019-04-04 15:49:00.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (3,NULL,'workstream',1,'document',3,0,0,'2019-04-04 07:51:20.000','2019-04-04 15:51:20.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (4,NULL,'workstream',1,'document',4,0,0,'2019-04-04 13:48:23.000','2019-04-04 21:48:23.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (5,NULL,'workstream',1,'document',5,0,0,'2019-04-04 13:49:01.000','2019-04-04 21:49:01.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (6,NULL,'workstream',1,'document',6,0,0,'2019-04-04 13:57:51.000','2019-04-04 21:57:51.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (7,NULL,'workstream',1,'document',7,0,0,'2019-04-04 13:58:20.000','2019-04-04 21:58:20.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (8,NULL,'workstream',1,'document',8,0,0,'2019-04-04 13:59:24.000','2019-04-04 21:59:24.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (9,NULL,'workstream',1,'document',9,0,0,'2019-04-04 14:02:08.000','2019-04-04 22:02:08.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (10,NULL,'workstream',1,'document',10,0,0,'2019-04-04 14:02:44.000','2019-04-04 22:02:44.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (11,NULL,'workstream',1,'document',12,0,0,'2019-04-04 14:12:11.000','2019-04-04 22:12:11.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (12,NULL,'workstream',1,'document',13,0,0,'2019-04-04 14:13:24.000','2019-04-04 22:13:24.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (13,NULL,'workstream',1,'document',14,0,0,'2019-04-04 14:14:17.000','2019-04-04 22:14:17.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (14,NULL,'workstream',1,'document',15,0,0,'2019-04-04 14:14:58.000','2019-04-04 22:14:58.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (15,NULL,'workstream',1,'document',16,0,0,'2019-04-04 14:15:37.000','2019-04-04 22:15:37.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (16,NULL,'workstream',1,'document',17,0,0,'2019-04-04 14:16:33.000','2019-04-04 22:16:33.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (17,NULL,'workstream',1,'document',18,0,0,'2019-04-04 14:21:32.000','2019-04-04 22:21:32.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (18,NULL,'workstream',1,'document',19,0,0,'2019-04-04 14:22:31.000','2019-04-04 22:22:31.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (19,NULL,'workstream',1,'document',20,0,0,'2019-04-04 14:28:15.000','2019-04-04 22:28:15.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (20,NULL,'workstream',1,'document',21,0,0,'2019-04-04 14:40:09.000','2019-04-04 22:40:09.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (21,NULL,'workstream',1,'document',22,0,0,'2019-04-04 14:42:10.000','2019-04-04 22:42:10.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (22,NULL,'workstream',1,'document',23,0,0,'2019-04-04 14:43:24.000','2019-04-04 22:43:24.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (23,NULL,'workstream',1,'document',24,0,0,'2019-04-04 14:44:59.000','2019-04-04 22:44:59.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (24,NULL,'workstream',1,'document',25,0,0,'2019-04-04 14:50:07.000','2019-04-04 22:50:07.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (25,NULL,'workstream',1,'document',26,0,0,'2019-04-04 14:51:08.000','2019-04-04 22:51:08.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (26,NULL,'workstream',1,'document',27,0,0,'2019-04-04 14:57:26.000','2019-04-04 22:57:26.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (27,NULL,'workstream',1,'document',28,0,0,'2019-04-04 14:58:05.000','2019-04-04 22:58:05.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (28,NULL,'workstream',1,'document',29,0,0,'2019-04-04 15:00:05.000','2019-04-04 23:00:05.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (29,NULL,'workstream',1,'document',30,0,0,'2019-04-04 15:02:47.000','2019-04-04 23:02:47.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (30,NULL,'workstream',1,'document',31,0,0,'2019-04-04 15:03:28.000','2019-04-04 23:03:28.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (31,NULL,'workstream',1,'document',32,0,0,'2019-04-04 15:06:27.000','2019-04-04 23:06:27.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (32,NULL,'workstream',1,'document',33,0,0,'2019-04-04 15:08:27.000','2019-04-04 23:08:27.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (33,NULL,'workstream',1,'document',34,0,0,'2019-04-04 15:09:17.000','2019-04-04 23:09:17.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (34,NULL,'workstream',1,'document',35,0,0,'2019-04-04 15:09:32.000','2019-04-04 23:09:32.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (35,NULL,'workstream',1,'document',36,0,0,'2019-04-04 15:10:36.000','2019-04-04 23:10:36.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (36,NULL,'workstream',1,'document',37,0,0,'2019-04-04 15:14:13.000','2019-04-04 23:14:13.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (37,NULL,'workstream',2,'document',38,0,0,'2019-04-04 15:15:17.000','2019-04-04 23:15:17.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (38,NULL,'workstream',2,'document',39,0,0,'2019-04-04 15:16:25.000','2019-04-04 23:16:25.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (39,NULL,'workstream',1,'document',39,0,0,'2019-04-04 15:16:25.000','2019-04-04 23:16:25.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (40,NULL,'workstream',2,'document',40,0,0,'2019-04-04 15:18:25.000','2019-04-04 23:18:25.000');
INSERT INTO `tag` (`id`,`indicator`,`linkType`,`linkId`,`tagType`,`tagTypeId`,`isDeleted`,`isCompleted`,`dateAdded`,`dateUpdated`) VALUES (41,NULL,'workstream',1,'document',40,0,0,'2019-04-04 15:18:25.000','2019-04-04 23:18:25.000');

INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`isActive`,`isDeleted`,`approvalRequired`,`approverId`,`approvalDueDate`,`dateCompleted`,`dateAdded`,`dateUpdated`) VALUES (1,1,'task 1',NULL,1,'2019-03-31 16:00:00.000',NULL,'In Progress',NULL,0,NULL,0,0,NULL,1,0,0,0,NULL,NULL,'2019-04-04 14:34:00.000','2019-04-04 22:34:00.000');
INSERT INTO `task` (`id`,`projectId`,`task`,`description`,`workstreamId`,`dueDate`,`startDate`,`status`,`typeId`,`periodic`,`periodType`,`period`,`periodInstance`,`periodTask`,`isActive`,`isDeleted`,`approvalRequired`,`approverId`,`approvalDueDate`,`dateCompleted`,`dateAdded`,`dateUpdated`) VALUES (2,1,'Task 2',NULL,1,'2019-03-31 16:00:00.000',NULL,'In Progress',NULL,0,NULL,0,0,NULL,1,0,0,0,NULL,NULL,'2019-04-04 15:13:53.000','2019-04-04 23:13:53.000');











INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,'Client','project','2019-04-04 14:45:08.000','2019-04-04 14:45:08.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (2,'Internal','project','2019-04-04 14:45:08.000','2019-04-04 14:45:08.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,'Private','project','2019-04-04 14:45:08.000','2019-04-04 14:45:08.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,'Output based','workstream','2019-04-04 14:45:08.000','2019-04-04 14:45:08.000',1,0);
INSERT INTO `type` (`id`,`type`,`linkType`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,'Time based','workstream','2019-04-04 14:45:08.000','2019-04-04 14:45:08.000',1,0);

INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (1,'John Aldrin','Tapia',NULL,NULL,'admin','c08f94cdbfd13e47333a2d6e18c5ab8b6d2c3fbf','4qVnChLYBUpVWuLXQsZBKQJcYiq5ZVRn','Internal',NULL,'johnaldrin.tapia@volenday.com','2019-04-04 14:47:51.000','2019-04-04 14:47:51.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (2,'internal.user1','internal.user1',NULL,NULL,'internal.user1','cf1e04f2fc7d9dbfc1cf97794f94a14b01e73375','9x1XzuGNSkgnEwUn3owz3JsxkSxFc6m2','Internal','https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png','internal.user1@gmail.com',NULL,'2019-04-04 21:50:07.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (3,'internal.user2','internal.user2',NULL,NULL,'internal.user2','983500297bdff161f9dbae895b7b05b99c00384a','8hAX4HNpf0D4tEnfXlLTf4hrxqnvQyYI','Internal','https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png','internal.user2@gmail.com',NULL,'2019-04-04 22:29:23.000',1,0,NULL);
INSERT INTO `users` (`id`,`firstName`,`lastName`,`phoneNumber`,`companyId`,`username`,`password`,`salt`,`userType`,`avatar`,`emailAddress`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`,`company`) VALUES (4,'internal.user3','internal.user3',NULL,NULL,'internal.user3','76ab92c4f89403930cf358675c926d6c923a858d','xHX6eLN7fpbo69PHpFCkr8A7UhVsUZYq','Internal','https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png','internal.user3@volenday.com',NULL,'2019-04-04 23:12:39.000',1,0,NULL);



INSERT INTO `users_notification_setting` (`id`,`usersId`,`taskAssigned`,`taskTagged`,`fileNewUpload`,`messageSend`,`commentReplies`,`taskDeadline`,`taskMemberCompleted`,`taskFollowingCompleted`,`taskTeamDeadline`,`taskFollowingDeadline`,`receiveEmail`,`dateAdded`,`dateUpdated`) VALUES (1,1,1,1,1,1,1,1,1,1,1,1,1,NULL,'2019-04-04 14:47:51.000');
INSERT INTO `users_notification_setting` (`id`,`usersId`,`taskAssigned`,`taskTagged`,`fileNewUpload`,`messageSend`,`commentReplies`,`taskDeadline`,`taskMemberCompleted`,`taskFollowingCompleted`,`taskTeamDeadline`,`taskFollowingDeadline`,`receiveEmail`,`dateAdded`,`dateUpdated`) VALUES (2,2,0,0,0,1,1,1,1,1,1,1,1,NULL,'2019-04-04 15:57:58.000');
INSERT INTO `users_notification_setting` (`id`,`usersId`,`taskAssigned`,`taskTagged`,`fileNewUpload`,`messageSend`,`commentReplies`,`taskDeadline`,`taskMemberCompleted`,`taskFollowingCompleted`,`taskTeamDeadline`,`taskFollowingDeadline`,`receiveEmail`,`dateAdded`,`dateUpdated`) VALUES (3,3,1,1,1,1,1,1,1,1,1,1,1,NULL,'2019-04-04 22:29:14.000');
INSERT INTO `users_notification_setting` (`id`,`usersId`,`taskAssigned`,`taskTagged`,`fileNewUpload`,`messageSend`,`commentReplies`,`taskDeadline`,`taskMemberCompleted`,`taskFollowingCompleted`,`taskTeamDeadline`,`taskFollowingDeadline`,`receiveEmail`,`dateAdded`,`dateUpdated`) VALUES (4,4,1,1,1,1,1,1,1,1,1,1,1,NULL,'2019-04-04 23:12:32.000');

INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (1,1,1,'2019-04-02 23:13:07.000','2019-04-02 23:13:07.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (3,2,4,NULL,'2019-04-04 21:49:55.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (4,3,4,NULL,'2019-04-04 22:29:14.000',1,0);
INSERT INTO `users_role` (`id`,`usersId`,`roleId`,`dateAdded`,`dateUpdated`,`isActive`,`isDeleted`) VALUES (5,4,4,NULL,'2019-04-04 23:12:32.000',1,0);



INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`description`,`numberOfHours`,`statusId`,`typeId`,`color`,`isActive`,`isTemplate`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (1,1,'Default Workstream',NULL,NULL,0,NULL,4,'#7fc7f7',1,0,0,'2019-04-04 06:45:55.000','2019-04-04 15:13:53.000');
INSERT INTO `workstream` (`id`,`projectId`,`workstream`,`projectName`,`description`,`numberOfHours`,`statusId`,`typeId`,`color`,`isActive`,`isTemplate`,`isDeleted`,`dateAdded`,`dateUpdated`) VALUES (2,1,'workstream2',NULL,NULL,0,NULL,4,'#599ac5',1,0,0,'2019-04-04 15:14:50.000','2019-04-04 15:14:50.000');