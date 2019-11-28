ALTER TABLE `cloud_cfo`.`project` 
ADD INDEX `project_index_1`(`isActive`, `isDeleted`, `typeId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`type` 
ADD UNIQUE INDEX `type_index_1`(`id`) USING BTREE;

ALTER TABLE `cloud_cfo`.`workstream` 
ADD INDEX `workstream_index_1`(`projectId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`members` 
ADD INDEX `members_index_1`(`linkId`, `usersType`, `linkType`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`document_link` 
ADD INDEX `documentLink_index_1`(`linkId`, `linkType`, `documentId`);

ALTER TABLE `cloud_cfo`.`users_role` 
ADD INDEX `userRole_index_1`(`usersId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`members` 
ADD INDEX `members_index_2`(`userTypeLinkId`, `usersType`, `linkType`) USING BTREE;

ALTER TABLE `cloud_cfo`.`team` 
ADD INDEX `team_index_1`(`teamLeaderId`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`users_notification_setting` 
ADD INDEX `usersNotificationSetting_index_1`(`usersId`, `id`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task` 
ADD INDEX `task_index_1`(`projectId`, `isDeleted`, `dueDate`) USING BTREE;

ALTER TABLE `cloud_cfo`.`users_team` 
ADD INDEX `usersTeam_index_1`(`usersId`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`session` 
ADD INDEX `session_index_1`(`session`) USING BTREE;

ALTER TABLE `cloud_cfo`.`members` 
ADD INDEX `members_index_3`(`userTypeLinkId`, `usersType`, `linkType`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`members` 
ADD INDEX `members_index_4`(`usersType`, `linkType`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`notification` 
ADD INDEX `notification_index_1`(`usersId`, `isDeleted`, `isRead`) USING BTREE;

ALTER TABLE `cloud_cfo`.`users_team` 
ADD INDEX `usersTeam_index_2`(`isDeleted`, `teamId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task` 
ADD INDEX `task_index_2`(`dueDate`, `id`, `isDeleted`, `status`, `isActive`, `approverId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task_dependency` 
ADD INDEX `taskDependency_index_1`(`taskId`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task_dependency` 
ADD INDEX `taskDependency_index_2`(`linkTaskId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`starred` 
ADD INDEX `starred_index_1`(`linkType`, `isActive`, `linkId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task_checklist` 
ADD INDEX `taskCheckList_index_1`(`isDeleted`, `taskId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`checklist_documents` 
ADD INDEX `checklistDocument_index_1`(`checklistId`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`task` 
ADD INDEX `task_index_3`(`workstreamId`, `dueDate`, `id`, `isDeleted`, `status`, `isActive`, `approverId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`role` 
ADD INDEX `role_index_1`(`isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`team` 
ADD INDEX `team_index_2`(`isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`tag` 
ADD INDEX `tag_index_1`(`linkType`, `tagType`) USING BTREE;

ALTER TABLE `cloud_cfo`.`notes` 
ADD INDEX `notes_index_1`(`workstreamId`) USING BTREE;

ALTER TABLE `cloud_cfo`.`tag` 
ADD INDEX `tag_index_2`(`linkType`, `tagType`, `tagTypeId`, `isDeleted`) USING BTREE;

ALTER TABLE `cloud_cfo`.`notes` 
ADD INDEX `notes_index_2`(`projectId`, `id`) USING BTREE;


/* new updates */