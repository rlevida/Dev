create or replace view tasks_completed_v as
select project.id     as projectId,
       count(task.id) as count
from project,
     task
where task.projectId = project.id
  and task.status = 'Completed'
  AND task.isDeleted = 0
group by project.id;

create or replace view tasks_total_v as
select project.id     as projectId,
       count(task.id) as count
from project,
     task
where task.projectId = project.id
  and task.isDeleted = 0
group by project.id;

create or replace view tasks_for_approval_v as
select project.id     as projectId,
       count(task.id) as count
from project,
     task
where task.projectId = project.id
  and task.status = 'For Approval'
  AND task.isDeleted = 0
group by project.id;

create or replace view tasks_due_today_v as
select project.id     as projectId,
       count(task.id) as count
from project,
     task
where task.projectId = project.id
  AND task.dueDate = DATE(NOW())
  AND task.status = 'In Progress'
  AND task.isDeleted = 0
group by project.id;

create or replace view tasks_delayed_v as
select project.id     as projectId,
       count(task.id) as count
from project,
     task
where task.projectId = project.id
  and task.dueDate < date(now())
  AND task.status = 'In Progress'
  AND task.isDeleted = 0
group by project.id;

create or replace view document_summary_view as select project.id as projectId,
                                                       count(document.id) as count
                                                from
                                                    project,
                                                    document
                                                where document.id in (select documentId from document_link where linkId = project.id AND linkType = 'project')
                                                  and document.folderId is null and document.isDeleted = 0
                                                group by project.id;

create or replace view tasks_summary_v as
select project.id                              as projectId,
       coalesce(tasks_total_v.count, 0)        as total,
       coalesce(tasks_delayed_v.count, 0)      as delayedStart,
       coalesce(tasks_due_today_v.count, 0)    as dueToday,
       coalesce(tasks_for_approval_v.count, 0) as forApproval,
       coalesce(tasks_completed_v.count, 0)    as completed,
       coalesce(document_summary_view.count, 0) as newDocuments
from project
         left outer join tasks_total_v on project.id = tasks_total_v.projectId
         left outer join tasks_delayed_v on project.id = tasks_delayed_v.projectId
         left outer join tasks_due_today_v on project.id = tasks_due_today_v.projectId
         left outer join tasks_for_approval_v on project.id = tasks_for_approval_v.projectId
         left outer join tasks_completed_v on project.id = tasks_completed_v.projectId
         left outer join document_summary_view on project.id = document_summary_view.projectId;

select * from tasks_summary_v;

