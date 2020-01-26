select project.id        as projectId,
       project.picture   as picture,
       project.project   as project,
       project.isDeleted as isDeleted,
       project.isActive  as isActive,
       project.projectType,
       project.color,
       project.tinNo,
       project.remindOnDuedate,
       project.remindBeforeDuedate,
       project.emailNotification,
       project.companyAddress,
       project.statusId,
       project.projectNameCount,
       project.createdBy,
       project.appNotification,
       project.classification,
       project.dateAdded,
       type.type         as type
from project,
     type
where project.id in (select linkId from members where userTypeLinkId = :userId AND linkType = 'project')
  and project.typeId = type.id
order by project.project;

