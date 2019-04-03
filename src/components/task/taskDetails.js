import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";
import { MentionsInput, Mention } from 'react-mentions';
import ReactTooltip from 'react-tooltip';

import { putData, postData, deleteData, getData, showToast } from "../../globalFunction";
import { DeleteModal, MentionConvert } from "../../globalComponents";
import defaultStyle from "../global/react-mention-style";

import DocumentViewerModal from "../document/modal/documentViewerModal";

let keyTimer = "";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        activityLog: store.activityLog,
        conversation: store.conversation
    }
})
export default class TaskDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "completeChecklist",
            "completeTask",
            "starredTask",
            "editTask",
            "confirmDelete",
            "followTask",
            "handleBack",
            "renderActivityLogs",
            "getNextAcitivyLogs",
            "handleChange",
            "renderUsers",
            "addComment"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        })
    }

    editTask() {
        const { dispatch } = { ...this.props };
        const { task } = { ...this.props };
        const { dueDate, startDate } = task.Selected;
        const toBeUpdatedObject = {
            ...task.Selected,
            dueDate: (dueDate != null) ? moment(dueDate).format("YYYY MMM DD") : null,
            startDate: (startDate != null) ? moment(startDate).format("YYYY MMM DD") : null
        };

        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
    }

    completeChecklist(id) {
        const { task, dispatch } = { ...this.props };
        const { checklist = [], periodic, dueDate, id: taskId, periodTask } = task.Selected;
        const updateIndex = _.findIndex(checklist, { id });
        const getSelectedChecklist = _.find(checklist, (o) => o.id == id);
        const isCompleted = (getSelectedChecklist.isCompleted == 0) ? 1 : 0;
        const updatedChecklistObj = {
            ...getSelectedChecklist, ...{
                isCompleted,
                isPeriodicTask: periodic,
                dueDate,
                periodTask,
                periodTask: (task.Selected.periodTask == null) ? taskId : periodTask
            }
        };

        if (updatedChecklistObj.isDocument == 1 && updatedChecklistObj.tagDocuments.length == 0) {
            showToast("error", "Item requires document to complete.");
        } else {
            putData(`/api/checklist/${id}`, updatedChecklistObj, (c) => {
                if (c.status == 200) {
                    checklist.splice(updateIndex, 1, updatedChecklistObj);
                    const toBeUpdatedObject = {
                        ...task.Selected,
                        checklist
                    };
                    dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
                    dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                    showToast("success", "Checklist successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }
    }

    completeTask(status) {
        const { task, dispatch, loggedUser } = { ...this.props };
        const { Selected } = task;
        const { periodTask, periodic, id } = Selected;
        const taskStatus = status;
        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: taskStatus }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, status: taskStatus } });
                showToast("success", "Task successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    starredTask() {
        const { task, loggedUser, dispatch } = this.props;
        const { Selected } = task;
        const isStarredValue = (Selected.isStarred > 0) ? 0 : 1;

        postData(`/api/starred/`, {
            linkType: "task",
            linkId: Selected.id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, isStarred: isStarredValue } });
                showToast("success", `Task successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    confirmDelete() {
        const { task, dispatch } = { ...this.props };
        const { id } = task.Selected;

        deleteData(`/api/task/${id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "DELETE_TASK", id });
                showToast("success", "Task successfully deleted.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            $(`#delete-task`).modal("hide");
        });
    }

    followTask({ id = "" }) {
        const { loggedUser, task, dispatch } = { ...this.props };
        const { task_members } = task.Selected;

        if (id == "") {
            const memberData = {
                usersType: "users",
                userTypeLinkId: loggedUser.data.id,
                linkType: "task",
                linkId: task.Selected.id,
                memberType: "follower"
            };
            postData(`/api/member`, { data: memberData, includes: 'user' }, (c) => {
                if (c.status == 200) {
                    const currentTaskMember = task_members;
                    currentTaskMember.push(c.data);
                    const updatedSelectedTask = { ...task.Selected, task_members: currentTaskMember };

                    if (task.Filter.type == "following") {
                        const currentTask = task.List;
                        currentTask.push(updatedSelectedTask)
                        dispatch({ type: "SET_TASK_LIST", list: currentTask });
                    }

                    dispatch({ type: "SET_TASK_SELECTED", Selected: updatedSelectedTask });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("success", "Something went wrong. Please try again later.");
                }
            });
        } else {
            putData(`/api/member/${id}`, { isDeleted: 1 }, (c) => {
                if (c.status == 200) {
                    const remainingMembers = _.remove(task_members, function (o) {
                        return o.id != id;
                    });
                    if (task.Filter.type == "following") {
                        const followingTasks = _.remove(task.List, (o) => {
                            return o.id != remainingMembers[0].linkId;
                        });
                        dispatch({ type: "SET_TASK_LIST", list: followingTasks });
                    }
                    dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, task_members: remainingMembers } });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("error", "Something went wrong. Please try again later.");
                }
            });
        }
    }

    handleBack() {
        const { history } = { ...this.props };

        if (history.location.search != "") {
            history.push(history.location.pathname)
        }
    }

    renderActivityLogs({ comment = "", linkType = "", actionType = "", type, user, users, dateAdded }) {
        const date = moment(dateAdded).from(new Date());
        if (type == "conversation") {
            return (
                <div key={users.id} class="comment">
                    <div class="thumbnail-profile">
                        <img src={users.avatar} alt="Profile Picture" class="img-responsive" />
                    </div>
                    <div>
                        <MentionConvert string={comment} />
                        <p class="note m0">Posted {date} by {users.firstName + " " + users.lastName}.</p>
                    </div>
                </div>
            )
        } else {
            const linkTypeName = (linkType == "checklist") ? "subtask" : linkType;
            return (
                <p class="ml20 mt10"><strong>{user.firstName + " " + user.lastName}</strong> {actionType + " " + linkTypeName}. {date}</p>
            )
        }
    }

    getNextAcitivyLogs() {
        const { activityLog, task, dispatch, conversation } = { ...this.props };
        const activityPage = activityLog.Count.current_page + 1;
        const conversationPage = conversation.Count.current_page + 1;

        if (activityPage <= activityLog.Count.last_page) {
            getData(`/api/activityLog?taskId=${task.Selected.id}&page=${activityPage}&includes=user`, {}, (c) => {
                if (c.status == 200) {
                    const { data } = c;
                    dispatch({ type: "UPDATE_ACTIVITYLOG_LIST", list: data.result, count: data.count });
                }
            });
        }
        if (conversationPage <= conversation.Count.last_page) {
            getData(`/api/conversation/getConversationList?page=${conversationPage}&linkType=task&linkId=${task.Selected.id}`, {}, (c) => {
                if (c.status == 200) {
                    const { data } = c;
                    dispatch({ type: "ADD_COMMENT_LIST", list: data.result, count: data.count });
                }
            });
        }
    }

    handleChange(name, e) {
        const { dispatch, conversation } = this.props
        const { Selected } = conversation;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, [name]: e.target.value } });
    }

    renderUsers(query, callback) {
        const { task } = { ...this.props };
        const { Selected } = task;

        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${Selected.projectId}&linkType=project`;
            if (typeof query != "undefined" && query != "") {
                fetchUrl += `&memberName=${query}`;
            }
            getData(fetchUrl, {}, (c) => {
                const projectMemberOptions = _(c.data)
                    .map((o) => { return { id: o.id, display: o.firstName + " " + o.lastName + ' - ' + o.username } })
                    .value();
                callback(projectMemberOptions);
            });
        }, 1500);
    }

    addComment() {
        const { conversation, task, loggedUser, dispatch } = this.props;
        const commentText = conversation.Selected.comment || "";
        const commentSplit = (commentText).split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit).filter((o) => {
            const regEx = /\[([^\]]+)]/;
            return regEx.test(o)
        }).map((o) => {
            return _.toNumber(o.match(/\((.*)\)/).pop());
        }).value();

        const dataToBeSubmited = {
            data: { comment: commentText, linkType: "task", linkId: task.Selected.id, usersId: loggedUser.data.id },
            reminderList: _.uniq(commentIds),
            taskId: task.Selected.id,
            projectId: task.Selected.projectId,
            userId: loggedUser.data.id,
        };

        dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });
        postData(`/api/conversation/comment`, dataToBeSubmited, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_COMMENT_LIST", comment: c.data });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
                dispatch({ type: "SET_COMMENT_SELECTED", Selected: { comment: "" } });
            } else {
                showToast("error", "Something went wrong. Please try again later.");
            }
        });
    }

    viewDocument(data) {
        const { dispatch, loggedUser } = { ...this.props };
        if (data.isRead) {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
            $(`#documentViewerModal`).modal('show')
        } else {
            const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 };
            postData(`/api/document/read`, dataToSubmit, (ret) => {
                dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: { ...data, document_read: [ret.data], isRead: 1 } });
                $(`#documentViewerModal`).modal('show')
            });
        }
    }

    render() {
        const { task: taskObj, loggedUser, activityLog, conversation } = { ...this.props };
        const { Loading, Selected } = taskObj;
        const { id, task, task_members, dueDate, startDate, workstream, status, description, checklist, task_dependency, tag_task, projectId, workstreamId } = Selected;
        const assigned = _.filter(task_members, (o) => { return o.memberType == "assignedTo" });
        const isAssignedToMe = _.find(task_members, (o) => { return o.memberType == "assignedTo" && o.user.id == loggedUser.data.id });
        const approver = _.filter(task_members, (o) => { return o.memberType == "approver" });
        const followers = _.filter(task_members, (o) => { return o.memberType == "follower" });
        const isFollower = _.find(followers, (o) => { return o.user.id == loggedUser.data.id }) || {};
        const typeValue = (typeof Selected.task != "undefined" && _.isEmpty(Selected) == false) ? Selected.task : "";
        const given = moment(dueDate, "YYYY-MM-DD");
        const current = moment().startOf('day');

        const currentActivityLogPage = (typeof activityLog.Count.current_page != "undefined") ? activityLog.Count.current_page : 1;
        const lastActivityLogPage = (typeof activityLog.Count.last_page != "undefined") ? activityLog.Count.last_page : 1;

        const currentConversationLogPage = (typeof conversation.Count.current_page != "undefined") ? conversation.Count.current_page : 1;
        const lastConversationLogPage = (typeof conversation.Count.last_page != "undefined") ? conversation.Count.last_page : 1;

        let daysRemaining = (dueDate != "") ? moment.duration(given.diff(current)).asDays() + 1 : 0;
        daysRemaining = (daysRemaining == 0 && dueDate != "") ? 1 : daysRemaining;
        const commentText = (typeof conversation.Selected.comment != "undefined") ? conversation.Selected.comment : "";
        const activityList = [..._.map(activityLog.List, (o) => { return { ...o, type: 'activity_log' } }), ..._.map(conversation.List, (o) => { return { ...o, type: 'conversation' } })]
        const checklistDocuments = _(checklist)
            .flatMap((o) => {
                return _.map(o.tagDocuments, function (o) {
                    return {
                        id: o.document.id,
                        origin: o.document.name,
                        name: o.document.origin,
                        type: "Subtask Document",
                        dateAdded: o.document.dateAdded,
                        isRead: o.document.document_read.length,
                        user: o.document.user,
                        child: _(checklist)
                            .filter((check) => { return check.id == o.checklistId })
                            .map((o) => { return o.description })
                            .value()
                    };
                })
            })
            .value();
        const taskDocuments = _(tag_task)
            .filter((o) => { return o.tagType == "document" })
            .map((o) => {
                return {
                    id: o.document.id,
                    origin: o.document.name,
                    name: o.document.origin,
                    type: "Task Document",
                    dateAdded: o.document.dateAdded,
                    isRead: o.document.document_read.length,
                    user: o.document.user
                }
            })
            .value();
        const documentList = [...checklistDocuments, ...taskDocuments];
        return (
            <div>
                <div class="modal right fade" id="task-details" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <a
                                    class="text-grey"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={this.handleBack}
                                >
                                    <span>
                                        <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                        <strong>Back</strong>
                                    </span>
                                </a>
                                <div class="row mt20 content-row">
                                    <div class="col-md-6 modal-action">
                                        <div>
                                            <div>
                                                {
                                                    (
                                                        ((Selected.approverId == loggedUser.data.id && Selected.status == "For Approval") ||
                                                            (typeof isAssignedToMe != "undefined" && Selected.status != "For Approval")) &&
                                                        (Selected.status == "For Approval" || Selected.status == "In Progress")
                                                    ) &&
                                                    <a class="btn btn-default mr5" onClick={() => this.completeTask((Selected.status == "For Approval") ? "In Progress" : "Completed")}>
                                                        <span>
                                                            <i class={`fa mr10 ${(Selected.status != "Completed") ? "fa-check" : "fa-ban"}`} aria-hidden="true"></i>
                                                            {`${(Selected.status == "For Approval") ? "Approve" : (Selected.status == "Completed") ? "Uncomplete" : "Complete"}`}
                                                        </span>
                                                    </a>
                                                }
                                                {
                                                    (typeof isAssignedToMe != "undefined" && Selected.status == "Completed") && <a class="btn btn-default" onClick={() => this.completeTask("In Progress")}>
                                                        <span>
                                                            <i class="fa mr10 fa-line-chart" aria-hidden="true"></i>
                                                            In Progress
                                                        </span>
                                                    </a>
                                                }
                                                {
                                                    (Selected.approverId == loggedUser.data.id && (Selected.status == "For Approval" || Selected.status == "In Progress")) && <a class="btn btn-default" onClick={() => this.completeTask("Rejected")}>
                                                        <span>
                                                            <i class="fa mr10 fa-ban" aria-hidden="true"></i>
                                                            Reject
                                                        </span>
                                                    </a>
                                                }
                                                {
                                                    (Selected.approverId == loggedUser.data.id && Selected.status == "Rejected") && <a class="btn btn-default" onClick={() => this.completeTask("For Approval")}>
                                                        <span>
                                                            <i class="fa mr10 fa-check" aria-hidden="true"></i>
                                                            For Approval
                                                        </span>
                                                    </a>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="button-action">
                                            <a class="logo-action text-grey" onClick={() => this.starredTask()}>
                                                <i title="FAVORITE" class={`fa ${Selected.isStarred ? "fa-star text-yellow" : "fa-star-o"}`} aria-hidden="true"></i>
                                            </a>
                                            <a class="logo-action text-grey" onClick={() => this.followTask(isFollower)}>
                                                <i title="FOLLOW" class={`fa ${_.isEmpty(isFollower) == false ? "fa-user-plus text-yellow" : "fa-user-plus"}`} aria-hidden="true"></i>
                                            </a>
                                            <a data-dismiss="modal" onClick={() => this.editTask()} class="logo-action text-grey"><i title="EDIT" class="fa fa-pencil" aria-hidden="true"></i></a>
                                            <a data-dismiss="modal" onClick={() => { $(`#delete-task`).modal("show"); }} class="logo-action text-grey"><i title="DELETE" class="fa fa-trash-o" aria-hidden="true"></i></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div class={(Loading == "RETRIEVING") ? "linear-background" : ""}>
                                    {
                                        (typeof id != "undefined") && <div>
                                            <div class="mt20 mb20">
                                                <h2 class="m0">{task}</h2>
                                                <p class="m0">
                                                    <a target="_blank"
                                                        href={window.location.origin + `/account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`}>
                                                        {window.location.origin + `/account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`}
                                                    </a>
                                                </p>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Assigned:</label>
                                                        {
                                                            _.map(assigned, (member, index) => {
                                                                const { user } = member;
                                                                return (
                                                                    <div key={index}>
                                                                        <div class="profile-div">
                                                                            <div class="thumbnail-profile">
                                                                                <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                            </div>
                                                                            <p class="m0">{user.firstName + " " + user.lastName}</p>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Start Date:</label>
                                                        <div>
                                                            <p class="mb0">
                                                                {
                                                                    (startDate != null) ? moment(startDate).format("MMMM DD, YYYY") : "N/A"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Project:</label>
                                                        <p class="m0" style={{ color: workstream.project.color }}>
                                                            {workstream.project.project}
                                                        </p>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Workstream:</label>
                                                        <p class="m0" style={{ color: workstream.color }}>
                                                            {workstream.workstream}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label>Follower/s:</label>
                                                        <div class="display-flex">
                                                            {
                                                                _.map(_.take(followers, 5), ({ user }, index) => {
                                                                    return (
                                                                        <div key={index} class="profile-div">
                                                                            <div class="thumbnail-profile" key={index}>
                                                                                <span title={user.firstName + " " + user.lastName}>
                                                                                    <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {
                                                                (followers.length > 5) && <span
                                                                    class="thumbnail-count"
                                                                    title={
                                                                        _(followers)
                                                                            .filter((o, index) => { return index > 4 })
                                                                            .map(({ user }) => {
                                                                                return user.firstName + " " + user.lastName
                                                                            })
                                                                            .value()
                                                                            .join("\r\n")
                                                                    }
                                                                >
                                                                    +{followers.length - 1}
                                                                </span>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Approver:</label>
                                                        {
                                                            (approver.length > 0) ?
                                                                _.map(approver, (member, index) => {
                                                                    const { user } = member;
                                                                    return (
                                                                        <div key={index}>
                                                                            <div class="profile-div">
                                                                                <div class="thumbnail-profile">
                                                                                    <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                                </div>
                                                                                <p class="m0">{user.firstName + " " + user.lastName}</p>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                }) : "N/A"
                                                        }
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Due Date:</label>
                                                        <div>
                                                            <p class={`${(daysRemaining < 0 && status != "Completed") ? "text-red mb0" : "mb0"}`}>
                                                                {
                                                                    (dueDate != null) ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Status:</label>
                                                        <div>
                                                            <p class={`m0 ${(status == "Completed") ? "text-green" : (status == "For Approval") ? "text-orange" : ""}`}>
                                                                {
                                                                    status
                                                                }
                                                            </p>
                                                            {
                                                                (daysRemaining < 0 && status != "Completed") && <p class="note text-red m0">Delayed</p>
                                                            }
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label>Dependency:</label>
                                                        <div class="ml20">
                                                            {
                                                                _.map(task_dependency, ({ task, dependencyType }, index) => {
                                                                    return (
                                                                        <div key={index}>
                                                                            <p class="m0">{task.task}</p>
                                                                            <p class="note text-blue">{dependencyType}</p>
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20 bb">
                                                <div class="col-md-12">
                                                    <div class="pb50">
                                                        <p class="m0">{description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-12 bb pb20">
                                                    <div>
                                                        <h3>
                                                            Attachments
                                                        </h3>
                                                        <div class="ml20">
                                                            {
                                                                _.map(documentList, ({ id, origin, name, child = [], isRead, user }, index) => {
                                                                    return (
                                                                        <div key={index}>
                                                                            <div class="display-flex vh-center mb10 attachment">
                                                                                <i title={(child.length > 0) ? "Subtask Document" : "Task Document"} class={`fa ${(child.length > 0) ? "fa-file-text" : "fa-file"} mr10`} aria-hidden="true"></i>
                                                                                <p class="m0">
                                                                                    <a data-tip data-for={`attachment-${index}`} onClick={() => this.viewDocument({ id, name: origin, origin: name, isRead, user })}>
                                                                                        {name.substring(0, 50)}{(name.length > 50) ? "..." : ""}
                                                                                    </a>
                                                                                </p>
                                                                            </div>
                                                                            {
                                                                                (child.length > 0) && <ReactTooltip id={`attachment-${index}`} aria-haspopup='true' type={'light'}>
                                                                                    <div class="wrapper">
                                                                                        <p class="mb0">Checklist:</p>
                                                                                        {
                                                                                            _.map(child, (o, index) => {
                                                                                                return (
                                                                                                    <div class="display-flex mb5 ml10" key={index}>
                                                                                                        <p class="tooltip-label">
                                                                                                            {o}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                )
                                                                                            })
                                                                                        }

                                                                                    </div>
                                                                                </ReactTooltip>
                                                                            }
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {
                                                                (typeof documentList == "undefined" || (documentList).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-12 bb pb20">
                                                    <div>
                                                        <h3>
                                                            Checklist
                                                        </h3>
                                                        <div class="ml20">
                                                            {
                                                                _.map(checklist, (checklistObj, index) => {
                                                                    const { id, isCompleted, isDocument, description } = { ...checklistObj };
                                                                    return (
                                                                        <div key={index}>
                                                                            <label class="custom-checkbox todo-checklist">
                                                                                {description}
                                                                                {
                                                                                    (isDocument == 1) && <span class="label label-success ml10">Document</span>
                                                                                }
                                                                                <input type="checkbox"
                                                                                    checked={isCompleted ? true : false}
                                                                                    onChange={() => { }}
                                                                                    onClick={() => this.completeChecklist(id)}
                                                                                />
                                                                                <span class="checkmark"></span>
                                                                            </label>
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                            {
                                                                (typeof checklist == "undefined" || (checklist).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-12">
                                                    <div>
                                                        <h3>
                                                            Activity
                                                        </h3>
                                                        <div class="ml20">
                                                            {
                                                                ((activityList).length > 0) && <div>
                                                                    {
                                                                        _.map(_.sortBy(activityList, 'dateAdded').reverse(), (log, index) => {
                                                                            return (
                                                                                <div key={index}>
                                                                                    {
                                                                                        this.renderActivityLogs(log)
                                                                                    }
                                                                                </div>
                                                                            )
                                                                        })
                                                                    }
                                                                </div>
                                                            }
                                                            {
                                                                ((activityList).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                            }
                                                            {
                                                                (currentActivityLogPage != lastActivityLogPage || currentConversationLogPage != lastConversationLogPage) && <p class="m0 text-center"><a onClick={() => this.getNextAcitivyLogs()}>Load More Activities</a></p>
                                                            }
                                                        </div>
                                                        <div class="ml20 mt20 mb20">
                                                            <div class="form-group mention">
                                                                <MentionsInput
                                                                    value={commentText}
                                                                    onChange={this.handleChange.bind(this, "comment")}
                                                                    style={defaultStyle}
                                                                    classNames={{
                                                                        mentions__input: 'form-control'
                                                                    }}
                                                                    markup="{[__display__](__id__)}"
                                                                >
                                                                    <Mention
                                                                        trigger="@"
                                                                        data={this.renderUsers}
                                                                        appendSpaceOnAdd={true}
                                                                        style={{ backgroundColor: '#ecf0f1', padding: 1 }}
                                                                    />
                                                                </MentionsInput>
                                                                {
                                                                    (commentText != "") && <a
                                                                        class="btn btn-violet mt10"
                                                                        onClick={this.addComment}
                                                                        disabled={(conversation.Loading == "SUBMITTING")}
                                                                    ><span>{
                                                                        (conversation.Loading == "SUBMITTING") ? "Sending ..." : "Submit Comment"
                                                                    }</span></a>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DeleteModal
                    id="delete-task"
                    type={'task'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
                <DocumentViewerModal />
            </div>
        )
    }
}