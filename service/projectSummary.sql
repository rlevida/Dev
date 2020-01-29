select project.id        as projectId,
       project.picture   as picture,
       project.project   as project,
       project.isDeleted as isDeleted,
       project.isActive  as isActive,
       project.projectType,
       project.color,
       project.tinNo,
       project.emailNotification,
       project.companyAddress,
       project.statusId,
       project.projectNameCount,
       project.createdBy,
       project.appNotification,
       project.classification,
       project.dateAdded,
       project.dateUpdated,
       type.type         as type,
       stats.total,
       stats.delayedStart,
       stats.dueToday,
       stats.forApproval,
       stats.completed,
       stats.newDocuments,
       project_workstream_summary_v.count as workstream
       {{memberSelectClause}}

from project,
     type,
     tasks_summary_v stats,
     project_workstream_summary_v
     {{memberFromClause}}
where
   project.typeId = type.id
  and stats.projectId = project.id 
  and project_workstream_summary_v.projectId = project.id
  and project.isActive = :isActive
  and project.isDeleted = :isDeleted
  {{adminWhereClause}}
  {{typeIdWhereClause}}
  {{memberWhereClause}}
order by project.project
  {{page}}
