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

/*
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
  and task.dueDate <  DATE(NOW())
  AND task.status = 'In Progress'
  AND task.isDeleted = 0
group by project.id;
*/

create or replace view document_summary_view as 
select  project.id as projectId,
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
       /*coalesce(tasks_delayed_v.count, 0)      as delayedStart,
       coalesce(tasks_due_today_v.count, 0)    as dueToday,*/
       coalesce(tasks_for_approval_v.count, 0) as forApproval,
       coalesce(tasks_completed_v.count, 0)    as completed,
       coalesce(document_summary_view.count, 0) as newDocuments
from project
         left outer join tasks_total_v on project.id = tasks_total_v.projectId
        /* left outer join tasks_delayed_v on project.id = tasks_delayed_v.projectId
         left outer join tasks_due_today_v on project.id = tasks_due_today_v.projectId */
         left outer join tasks_for_approval_v on project.id = tasks_for_approval_v.projectId
         left outer join tasks_completed_v on project.id = tasks_completed_v.projectId
         left outer join document_summary_view on project.id = document_summary_view.projectId;

select * from tasks_summary_v;

create or replace view project_workstream_summary_v as
select  project.id as projectId,
        count(workstream.id) as count 
from  project, 
      workstream 
where workstream.projectId = project.id 
      and workstream.isDeleted = 0 
group By project.id;

#-------------PROJECT MEMBERS START-------------
create or replace view members_v as
select  members.linkId as projectId , 
      users.firstName as firstName,
      users.lastName as lastName,
      users.avatar as avatar,
      users.emailAddress as emailAddress
from  project,members,users
where project.id = members.linkId
      and users.id = members.userTypeLinkId
      and members.linkType = 'project'
      and members.isDeleted = 0
      and (members.memberType = 'assignedTo' or members.memberType = 'project manager');

create or replace view project_members_v as
select projectId, JSON_ARRAYAGG(JSON_OBJECT('firstName',firstName,'lastName',lastName,'avatar',avatar)) as members from members_v group by projectId;

create or replace view project_members_summary_v as
select project.id as projectId, 
  coalesce(project_members_v.members, '[]') as members
from project 
left outer join project_members_v on project.id = project_members_v.projectId order by id

select * from project_members_summary_v;

#-------------PROJECT MEMBERS END-------------

#----------PROJECT TEAM MEMBERS START---------
create or replace view teams_v as
select  members.userTypeLinkId as teamId,
        members.linkId as projectId
from  members,
      team
where members.usersType = 'team'
      and members.linkType = 'project'
      and members.userTypeLinkId = team.id
      and members.isDeleted = 0
      and team.isDeleted = 0;

create or replace view users_team_v as
select  users_team.teamId as teamId,
        users.firstName as firstName,
        users.lastName as lastName,
        users.avatar as avatar,
        users.emailAddress as emailAddress
from  users,users_team 
where users.id = users_team.usersId
      and users_team.isDeleted = 0;

create or replace view project_teams_v as
select teams_v.projectId,
      teams_v.teamId as teamId,
      users_team_v.firstname,
      users_team_v.lastName,
      users_team_v.avatar
from teams_v
left outer join users_team_v on teams_v.teamId = users_team_v.teamId

create or replace view project_team_members_v as
select projectId, JSON_ARRAYAGG(JSON_OBJECT('firstName',firstName,'lastName',lastName,'avatar',avatar)) as members from project_teams_v group by projectId;


create or replace view project_team_members_summary_v as
select project.id as projectId, 
  coalesce(project_team_members_v.members, '[]') as members
from project 
left outer join project_team_members_v on project.id = project_team_members_v.projectId order by id;

select * from  project_team_members_summary_v;

#----------PROJECT TEAM MEMBERS END---------
