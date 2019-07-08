import React from "react";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";
import { MentionsInput, Mention } from "react-mentions";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import ReactTooltip from "react-tooltip";

import { putData, postData, deleteData, getData, showToast } from "../../globalFunction";
import { DeleteModal, MentionConvert } from "../../globalComponents";
import defaultStyle from "../global/react-mention-style";
import { DropDown } from "../../globalComponents";

import DocumentViewerModal from "../document/modal/documentViewerModal";
import TaskChecklist from "./taskChecklist";
import TaskDocument from "./taskDocument";
import TaskTimeLog from "./taskTimeLog";

let keyTimer = "";

@connect(store => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        activityLog: store.activityLog,
        conversation: store.conversation,
        document: store.document,
        tasktimeLog: store.tasktimeLog
    };
})
export default class TaskDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map(
            [
                "completeChecklist",
                "completeTask",
                "starredTask",
                "editTask",
                "confirmDelete",
                "followTask",
                "handleBack",
                "renderActivityLogs",
                "getNextActivityLogs",
                "handleChange",
                "renderUsers",
                "addComment",
                "deleteSubtask",
                "deleteDocument",
                "confirmDeleteDocument",
                "replyComment",
                "getNextTimeLogs",
                "renameDocument",
                "editDocument",
                "tagChecklist",
                "updateDocumentChecklist"
            ],
            fn => {
                this[fn] = this[fn].bind(this);
            }
        );
    }
    componentDidMount() {
        const { dispatch } = { ...this.props };
        $("#task-documents").on("hidden.bs.modal", () => {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [] });
            dispatch({ type: "SET_DOCUMENT_UPLOAD_TYPE", uploadType: null });
            dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
        });
    }

    componentWillUnmount() {
        $(`#task-details`).modal("hide");
    }

    editTask() {
        const { dispatch } = { ...this.props };
        const { task } = { ...this.props };
        const { dueDate, startDate } = task.Selected;
        const toBeUpdatedObject = {
            ...task.Selected,
            dueDate: dueDate != null ? moment(dueDate) : null,
            startDate: startDate != null ? moment(startDate) : null
        };

        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
    }

    completeChecklist(id) {
        const { task, dispatch, loggedUser } = { ...this.props };
        const { checklist = [], periodic, dueDate, id: taskId, periodTask } = task.Selected;
        const updateIndex = _.findIndex(checklist, { id });
        const getSelectedChecklist = _.find(checklist, o => o.id == id);
        const isCompleted = getSelectedChecklist.isCompleted == 0 ? 1 : 0;
        const updatedChecklistObj = {
            ...getSelectedChecklist,
            ...{
                isCompleted,
                isPeriodicTask: periodic,
                dueDate,
                periodTask,
                periodTask: task.Selected.periodTask == null ? taskId : periodTask,
                userId: loggedUser.data.id
            }
        };

        if (updatedChecklistObj.isDocument == 1 && updatedChecklistObj.tagDocuments.length == 0) {
            showToast("error", "Item requires document to complete.");
        } else {
            putData(`/api/checklist/${id}`, updatedChecklistObj, c => {
                if (c.status == 200) {
                    checklist.splice(updateIndex, 1, updatedChecklistObj);
                    const toBeUpdatedObject = {
                        ...task.Selected,
                        checklist
                    };
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: [toBeUpdatedObject] });
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
        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: taskStatus }, c => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, status: taskStatus } });
                showToast("success", "Task successfully updated.");
                if (taskStatus === "Completed") {
                    dispatch({ type: "DELETE_TASK_TIMELINE", id: Selected.id });
                } else if (taskStatus === "In Progress") {
                    const taskTimeline = task.Timeline.concat([{ ...Selected, status: taskStatus }]);
                    dispatch({ type: "SET_TASK_TIMELINE", list: _.orderBy(taskTimeline, ["dueDate"], ["asc"]) });
                }
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    starredTask() {
        const { task, loggedUser, dispatch } = this.props;
        const { Selected } = task;
        const isStarredValue = Selected.isStarred > 0 ? 0 : 1;

        postData(
            `/api/starred/`,
            {
                linkType: "task",
                linkId: Selected.id,
                usersId: loggedUser.data.id
            },
            c => {
                if (c.status == 200) {
                    dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, isStarred: isStarredValue } });
                    showToast("success", `Task successfully ${isStarredValue > 0 ? "starred" : "unstarred"}.`);
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            }
        );
    }

    confirmDelete() {
        const { task, dispatch } = { ...this.props };
        const { id } = task.Selected;

        deleteData(`/api/task/${id}`, {}, c => {
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
            postData(`/api/member`, { data: memberData, includes: "user" }, c => {
                if (c.status == 200) {
                    const currentTaskMember = task_members;
                    currentTaskMember.push(c.data);
                    const updatedSelectedTask = { ...task.Selected, task_members: currentTaskMember };

                    if (task.Filter.type == "following") {
                        const currentTask = task.List;
                        currentTask.push(updatedSelectedTask);
                        dispatch({ type: "SET_TASK_LIST", list: currentTask });
                    }

                    dispatch({ type: "SET_TASK_SELECTED", Selected: updatedSelectedTask });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("success", "Something went wrong. Please try again later.");
                }
            });
        } else {
            putData(`/api/member/${id}`, { isDeleted: 1 }, c => {
                if (c.status == 200) {
                    const remainingMembers = _.remove(task_members, function(o) {
                        return o.id != id;
                    });
                    if (task.Filter.type == "following") {
                        const followingTasks = _.remove(task.List, o => {
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
            history.push(history.location.pathname);
        }
    }

    renderActivityLogs({ comment = "", linkType = "", actionType = "", type, user, users, dateAdded }) {
        const duration = moment.duration(moment().diff(moment(dateAdded)));
        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());

        if (type == "conversation") {
            return (
                <div key={users.id} class="comment">
                    <div class="thumbnail-profile">
                        <img src={users.avatar} alt="Profile Picture" class="img-responsive" />
                    </div>
                    <div>
                        <MentionConvert string={comment} />
                        <p class="note m0">
                            Posted {date} by {users.firstName + " " + users.lastName}.
                        </p>
                        <p class="note m0">
                            <a onClick={() => this.replyComment(users)}>Reply</a>
                        </p>
                    </div>
                </div>
            );
        } else {
            const linkTypeName = linkType == "checklist" ? "subtask" : linkType;
            return (
                <div>
                    <p class="ml10 mt10">
                        <strong>{user.firstName + " " + user.lastName + " "}</strong>
                        {actionType + ` ${linkTypeName == "task" ? "the" : "a"} ` + linkTypeName}. {date}
                    </p>
                </div>
            );
        }
    }

    getNextActivityLogs() {
        const { activityLog, task, dispatch, conversation } = { ...this.props };
        const activityPage = activityLog.Count.current_page + 1;
        const conversationPage = conversation.Count.current_page + 1;

        if (activityPage <= activityLog.Count.last_page) {
            getData(`/api/activityLog?taskId=${task.Selected.id}&page=${activityPage}&includes=user`, {}, c => {
                if (c.status == 200) {
                    const { data } = c;
                    dispatch({ type: "UPDATE_ACTIVITYLOG_LIST", list: data.result, count: data.count });
                }
            });
        }
        if (conversationPage <= conversation.Count.last_page) {
            getData(`/api/conversation/getConversationList?page=${conversationPage}&linkType=task&linkId=${task.Selected.id}`, {}, c => {
                if (c.status == 200) {
                    const { data } = c;
                    dispatch({ type: "ADD_COMMENT_LIST", list: data.result, count: data.count });
                }
            });
        }
    }

    handleChange(name, e) {
        const { dispatch, conversation } = this.props;
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
            getData(fetchUrl, {}, c => {
                const projectMemberOptions = _(c.data)
                    .map(o => {
                        return { id: o.id, display: o.firstName + " " + o.lastName + " - " + o.username };
                    })
                    .value();
                callback(projectMemberOptions);
            });
        }, 1500);
    }

    addComment() {
        const { conversation, task, loggedUser, dispatch } = this.props;
        const commentType = conversation.Selected.type || "";
        const commentText = conversation.Selected.comment || "";
        const commentSplit = commentText.split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit)
            .filter(o => {
                const regEx = /\[([^\]]+)]/;
                return regEx.test(o);
            })
            .map(o => {
                return _.toNumber(o.match(/\((.*)\)/).pop());
            })
            .value();

        const dataToBeSubmited = {
            data: { comment: commentText, linkType: "task", linkId: task.Selected.id, usersId: loggedUser.data.id },
            reminderList: _.uniq(commentIds),
            taskId: task.Selected.id,
            projectId: task.Selected.projectId,
            userId: loggedUser.data.id,
            type: commentType
        };

        dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });

        postData(`/api/conversation/comment`, dataToBeSubmited, c => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_COMMENT_LIST", comment: c.data });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
                dispatch({ type: "SET_COMMENT_SELECTED", Selected: { comment: "" } });
            } else {
                showToast("error", "Something went wrong. Please try again later.");
            }
        });
    }

    replyComment({ firstName, lastName, username, id }) {
        const { dispatch, conversation } = this.props;
        const { Selected } = conversation;
        this.mentionInput.focus();
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, comment: `{[${firstName + " " + lastName} - ${username}](${id})} `, type: "reply" } });
    }

    viewDocument(data) {
        const { dispatch, loggedUser } = { ...this.props };
        getData(`/api/document/detail/${data.id}?starredUser=${loggedUser.data.id}`, {}, ret => {
            const documentObj = { ...ret.data };
            $(`#documentViewerModal`).modal("show");

            getData(`/api/conversation/getConversationList?page=${1}&linkType=document&linkId=${documentObj.id}`, {}, c => {
                dispatch({ type: "SET_COMMENT_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });

                if (documentObj.isRead.length) {
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: documentObj });
                    $(`#documentViewerModal`).modal("show");
                } else {
                    const dataToSubmit = { usersId: loggedUser.data.id, documentId: documentObj.id, isDeleted: 0 };
                    postData(`/api/document/read`, dataToSubmit, ret => {
                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...documentObj, document_read: [ret.data], isRead: 1 } });
                    });
                }
            });
        });
    }

    deleteSubtask(id) {
        const { dispatch, task, loggedUser } = this.props;

        deleteData(`/api/checklist/${id}?taskId=${task.Selected.id}&userId=${loggedUser.data.id}`, {}, c => {
            dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
            dispatch({
                type: "SET_TASK_SELECTED",
                Selected: {
                    ...task.Selected,
                    checklist: _.remove(task.Selected.checklist, ({ id: checklistId }) => {
                        return checklistId != id;
                    })
                }
            });
            showToast("success", "Subtask successfully deleted.");
        });
    }

    deleteDocument(value) {
        const { dispatch } = { ...this.props };
        if (value.child.length > 0) {
            showToast("error", "Document has checklist.");
        } else {
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...value, action: "DELETE" } });
            $("#delete-document").modal("show");
        }
    }

    confirmDeleteDocument() {
        const { dispatch, document, task, loggedUser } = this.props;

        deleteData(`/api/task/document/${document.Selected.id}?type=${document.Selected.type}&userId=${loggedUser.data.id}`, {}, c => {
            if (document.Selected.type == "Task Document") {
                const taskDocument = _.filter(task.Selected.tag_task, o => {
                    return o.document.id != document.Selected.id;
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, tag_task: taskDocument } });
            } else {
                const checklist = _.map(task.Selected.checklist, o => {
                    const checklistDocument = _.filter(o.tagDocuments, o => {
                        return o.documentId != document.Selected.id;
                    });
                    return {
                        ...o,
                        tagDocuments: checklistDocument,
                        isCompleted: checklistDocument.length > 0 && o.isDocument == 1 ? 1 : checklistDocument.length == 0 && o.isDocument == 1 ? 0 : o.isCompleted
                    };
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, checklist } });
            }

            if (c.data.activity_logs.length > 0) {
                _.map(c.data.activity_logs, o => {
                    dispatch({ type: "ADD_ACTIVITYLOG", activity_log: o });
                });
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            showToast("success", "Task Document successfully deleted.");
            $("#delete-document").modal("hide");
        });
    }

    editDocument(value) {
        const { dispatch } = this.props;
        dispatch({
            type: "SET_DOCUMENT_SELECTED",
            Selected: {
                ...value,
                file_name: value.origin
                    .split(".")
                    .slice(0, -1)
                    .join("."),
                action: "RENAME"
            }
        });
    }

    renameDocument() {
        const { document, loggedUser, task, dispatch } = this.props;
        const renamedDocument = document.Selected.file_name + "." + document.Selected.origin.split(".").pop();
        const dataToBeSubmited = {
            usersId: loggedUser.data.id,
            origin: renamedDocument,
            oldDocument: document.Selected.origin,
            newDocument: renamedDocument,
            projectId: task.Selected.projectId,
            type: "document"
        };

        putData(`/api/document/rename/${document.Selected.id}`, dataToBeSubmited, c => {
            if (document.Selected.type == "Task Document") {
                const taskDocument = _.map(task.Selected.tag_task, o => {
                    return o.document.id == document.Selected.id ? { ...o, document: { ...o.document, origin: renamedDocument } } : o;
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, tag_task: taskDocument } });
            } else {
                const checklist = _.map(task.Selected.checklist, o => {
                    const checklistDocument = _.map(o.tagDocuments, o => {
                        return o.documentId == document.Selected.id ? { ...o, document: { ...o.document, origin: renamedDocument } } : o;
                    });
                    return { ...o, tagDocuments: checklistDocument, isCompleted: checklistDocument.length > 0 ? 1 : 0 };
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, checklist } });
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            showToast("success", "Document successfully updated.");
        });
    }

    getNextTimeLogs() {
        const { dispatch, tasktimeLog, task } = this.props;
        const tasktimeLogPage = tasktimeLog.Count.current_page + 1;
        getData(`/api/taskTimeLogs?taskId=${task.Selected.id}&page=${tasktimeLogPage}`, {}, c => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_TASKTIMELOG_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_TOTAL_HOURS", total: c.data.total_hours });
            }
        });
    }

    tagChecklist(value) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...value, action: "TAG" } });
    }

    updateDocumentChecklist() {
        const { document, loggedUser, task, dispatch } = this.props;
        const dataToBeSubmited = {
            usersId: loggedUser.data.id,
            documentId: document.Selected.id,
            checklistIds: document.Selected.child,
            taskId: task.Selected.id
        };
        putData(`/api/checklist/tagDocument/${document.Selected.id}`, dataToBeSubmited, c => {
            const checklist = _.map(task.Selected.checklist, o => {
                const updatedComplete = _.find(c.data.checklist, ({ id }) => {
                    return id == o.id;
                });
                return {
                    ...o,
                    isCompleted: typeof updatedComplete != "undefined" ? updatedComplete.isCompleted : o.isCompleted,
                    tagDocuments: typeof updatedComplete != "undefined" ? updatedComplete.tagDocuments : o.tagDocuments
                };
            });
            const toBeUpdatedObject = {
                ...task.Selected,
                checklist
            };
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: [toBeUpdatedObject] });
            dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });

            if (c.data.activity_logs.length > 0) {
                _.map(c.data.activity_logs, o => {
                    dispatch({ type: "ADD_ACTIVITYLOG", activity_log: o });
                });
            }

            showToast("success", "Document successfully updated.");
        });
    }

    render() {
        const { task: taskObj, loggedUser, activityLog, conversation, document, dispatch, tasktimeLog } = { ...this.props };
        const commentType = conversation.Selected.type || "";
        const { Loading, Selected } = taskObj;
        const { id, task, task_members, dueDate, startDate, workstream, status, description, checklist, task_dependency = [], tag_task, projectId, workstreamId } = Selected;
        const assigned = _.find(task_members, o => {
            return o.memberType == "assignedTo";
        });
        const isAssignedToMe = _.find(task_members, o => {
            return o.memberType == "assignedTo" && o.user.id == loggedUser.data.id;
        });
        const approver = _.filter(task_members, o => {
            return o.memberType == "approver";
        });
        const followers = _.filter(task_members, o => {
            return o.memberType == "follower";
        });
        const isFollower =
            _.find(followers, o => {
                return o.user.id == loggedUser.data.id;
            }) || {};
        const typeValue = typeof Selected.task != "undefined" && _.isEmpty(Selected) == false ? Selected.task : "";
        const given = moment(dueDate, "YYYY-MM-DD");
        const current = moment().startOf("day");
        const currentActivityLogPage = typeof activityLog.Count.current_page != "undefined" ? activityLog.Count.current_page : 1;
        const lastActivityLogPage = typeof activityLog.Count.last_page != "undefined" ? activityLog.Count.last_page : 1;

        const currentConversationLogPage = typeof conversation.Count.current_page != "undefined" ? conversation.Count.current_page : 1;
        const lastConversationLogPage = typeof conversation.Count.last_page != "undefined" ? conversation.Count.last_page : 1;

        let daysRemaining = dueDate != "" ? moment.duration(given.diff(current)).asDays() + 1 : 0;
        daysRemaining = daysRemaining == 0 && dueDate != "" ? 1 : daysRemaining;
        const commentText = typeof conversation.Selected.comment != "undefined" ? conversation.Selected.comment : "";
        const activityList = [
            ..._.map(activityLog.List, o => {
                return { ...o, type: "activity_log" };
            }),
            ..._.map(conversation.List, o => {
                return { ...o, type: "conversation" };
            })
        ];
        const checklistDocuments = _(checklist)
            .flatMap(o => {
                return _.map(o.tagDocuments, function(o) {
                    return {
                        id: o.document.id,
                        origin: o.document.origin,
                        name: o.document.name,
                        type: "Subtask Document",
                        dateAdded: o.document.dateAdded,
                        isRead: o.document.document_read,
                        user: o.document.user,
                        documentNameCount: o.document.documentNameCount
                    };
                });
            })
            .value();
        const taskDocuments = _(tag_task)
            .map(o => {
                return {
                    id: o.document.id,
                    origin: o.document.origin,
                    name: o.document.name,
                    type: "Task Document",
                    dateAdded: o.document.dateAdded,
                    isRead: o.document.document_read,
                    user: o.document.user,
                    documentNameCount: o.document.documentNameCount
                };
            })
            .value();
        const documentList = _([...taskDocuments, ...checklistDocuments])
            .map(o => {
                return {
                    ...o,
                    child: _(checklist)
                        .filter(check => {
                            return (
                                _.filter(check.tagDocuments, tagDoc => {
                                    return tagDoc.document.id == o.id;
                                }).length > 0
                            );
                        })
                        .map(o => {
                            return o;
                        })
                        .value()
                };
            })
            .uniqBy("id")
            .sortBy("dateAdded")
            .reverse()
            .value();
        const documentValue = typeof document.Selected != "undefined" && _.isEmpty(document.Selected) == false ? document.Selected.origin : "";
        const totalHours = _(tasktimeLog.TotalHours)
            .map(({ period, value }) => {
                const toBeAdded = period == "hours" ? value * 60 : value;
                return _.toNumber(toBeAdded);
            })
            .value();
        const totalHoursValue = (_.sum(totalHours) / 60).toFixed(2);
        return (
            <div>
                <div class="modal right fade" id="task-details" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <a class="text-grey" data-dismiss="modal" aria-label="Close" onClick={this.handleBack}>
                                    <span>
                                        <i class="fa fa-chevron-left mr10" aria-hidden="true" />
                                        <strong>Back</strong>
                                    </span>
                                </a>
                                <div class="row mt20 content-row">
                                    <div class="col-md-6 modal-action">
                                        <div>
                                            {typeof checklist != "undefined" &&
                                                (checklist.length == 0 ||
                                                    _.filter(checklist, ({ isCompleted }) => {
                                                        return isCompleted == 1;
                                                    }).length == checklist.length) &&
                                                Selected.status == "In Progress" &&
                                                Selected.approvalRequired == 0 &&
                                                (loggedUser.data.userRole < 4 ||
                                                    typeof isAssignedToMe != "undefined" ||
                                                    (loggedUser.data.userRole >= 4 && (typeof Selected.workstream != "undefined" && Selected.workstream.project.type.type == "Client") && assigned.user.userType == "External") ||
                                                    (loggedUser.data.userRole >= 4 && (typeof Selected.workstream != "undefined" && Selected.workstream.project.type.type == "Internal") && assigned.user.user_role[0].roleId == 4)) && (
                                                    <a class="btn btn-default mr5" onClick={() => this.completeTask("Completed")}>
                                                        <span>
                                                            <i class="fa mr10 fa-check" aria-hidden="true" />
                                                            Complete
                                                        </span>
                                                    </a>
                                                )}
                                            {((Selected.status == "In Progress" &&
                                                Selected.approvalRequired == 1 &&
                                                (typeof isAssignedToMe != "undefined" ||
                                                    loggedUser.data.userRole < 4 ||
                                                    (loggedUser.data.userRole >= 4 && (typeof Selected.workstream != "undefined" && Selected.workstream.project.type.type == "Client") && assigned.user.userType == "External") ||
                                                    (loggedUser.data.userRole >= 4 && (typeof Selected.workstream != "undefined" && Selected.workstream.project.type.type == "Internal") && assigned.user.user_role[0].roleId == 4))) ||
                                                (Selected.status == "Rejected" && typeof isAssignedToMe != "undefined") ||
                                                (Selected.status == "Completed" && Selected.approvalRequired == 1 && Selected.approverId == loggedUser.data.id) ||
                                                (Selected.status == "In Progress" &&
                                                    Selected.approvalRequired == 1 &&
                                                    loggedUser.data.userRole >= 4 &&
                                                    (typeof Selected.workstream != "undefined" && Selected.workstream.project.type.type == "Client") &&
                                                    assigned.user.userType == "External")) && (
                                                <a class="btn btn-default" onClick={() => this.completeTask("For Approval")}>
                                                    <span>
                                                        <i class="fa mr10 fa-check" aria-hidden="true" />
                                                        For Approval
                                                    </span>
                                                </a>
                                            )}
                                            {loggedUser.data.userRole < 4 &&
                                                ((Selected.status == "Completed" && Selected.approvalRequired == 0) || (Selected.status == "For Approval" && Selected.approvalRequired == 1 && typeof isAssignedToMe != "undefined")) && (
                                                    <a class="btn btn-default" onClick={() => this.completeTask("In Progress")} title="Undo">
                                                        <span>
                                                            <i class="fa mr10 fa-line-chart" aria-hidden="true" />
                                                            Completed
                                                        </span>
                                                    </a>
                                                )}
                                            {(Selected.approverId == loggedUser.data.id || loggedUser.data.userRole < 3) && Selected.status == "For Approval" && (
                                                <a class="btn btn-default mr5" onClick={() => this.completeTask("Completed")}>
                                                    <span>
                                                        <i class="fa mr10 fa-check" aria-hidden="true" />
                                                        Approve
                                                    </span>
                                                </a>
                                            )}
                                            {(Selected.approverId == loggedUser.data.id || loggedUser.data.userRole < 3) && Selected.status == "For Approval" && (
                                                <a class="btn btn-default" onClick={() => this.completeTask("Rejected")}>
                                                    <span>
                                                        <i class="fa mr10 fa-ban" aria-hidden="true" />
                                                        Reject
                                                    </span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="button-action">
                                            <a
                                                class="logo-action text-grey"
                                                onClick={() => {
                                                    $(`#task-time`).modal("show");
                                                }}
                                            >
                                                <i title="LOG TIME" class="fa fa-clock-o" aria-hidden="true" />
                                            </a>
                                            <a class="logo-action text-grey" onClick={() => this.starredTask()}>
                                                <i title="FAVORITE" class={`fa ${Selected.isStarred ? "fa-star text-yellow" : "fa-star-o"}`} aria-hidden="true" />
                                            </a>
                                            <a
                                                class="logo-action text-grey"
                                                onClick={() => {
                                                    $(`#task-documents`).modal("show");
                                                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, ["document_type"]: "task_document" } });
                                                }}
                                            >
                                                <i title="ATTACHMENT" class="fa fa-file-o" aria-hidden="true" />
                                            </a>
                                            {status != "Completed" && (
                                                <div>
                                                    <a class="logo-action text-grey" onClick={() => this.followTask(isFollower)}>
                                                        <i title="FOLLOW" class={`fa ${_.isEmpty(isFollower) == false ? "fa-user-plus text-yellow" : "fa-user-plus"}`} aria-hidden="true" />
                                                    </a>
                                                    {(status != "Completed" || loggedUser.data.userRole < 6) && (
                                                        <a data-dismiss="modal" onClick={() => this.editTask()} class="logo-action text-grey">
                                                            <i title="EDIT" class="fa fa-pencil" aria-hidden="true" />
                                                        </a>
                                                    )}
                                                    <a
                                                        data-dismiss="modal"
                                                        onClick={() => {
                                                            $(`#delete-task`).modal("show");
                                                        }}
                                                        class="logo-action text-grey"
                                                    >
                                                        <i title="DELETE" class="fa fa-trash-o" aria-hidden="true" />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div class={Loading == "RETRIEVING" ? "linear-background" : ""}>
                                    {typeof id != "undefined" && (
                                        <div>
                                            <div class="mt20 mb20">
                                                <h2 class="m0">{task}</h2>
                                                <p class="m0">
                                                    <a target="_blank" href={window.location.origin + `/account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`}>
                                                        {window.location.origin + `/account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`}
                                                    </a>
                                                </p>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Assigned:</label>
                                                        {typeof assigned != "undefined" && assigned != "" && (
                                                            <div>
                                                                <div class="profile-div">
                                                                    <div class="thumbnail-profile">
                                                                        <img src={assigned.user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                    </div>
                                                                    <p class="m0">{assigned.user.firstName + " " + assigned.user.lastName}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Start Date:</label>
                                                        <div>
                                                            <p class="mb0">{startDate != null ? moment(startDate).format("MMMM DD, YYYY") : "N/A"}</p>
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
                                                    <div class={followers.length == 0 ? "label-div" : ""}>
                                                        <label>Follower/s:</label>
                                                        {followers.length == 0 && <p class="m0">N/A</p>}
                                                        <div class="display-flex">
                                                            {_.map(_.take(followers, 5), ({ user }, index) => {
                                                                return (
                                                                    <div key={index} class="profile-div">
                                                                        <div class="thumbnail-profile" key={index}>
                                                                            <span title={user.firstName + " " + user.lastName}>
                                                                                <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {followers.length > 5 && (
                                                                <span
                                                                    class="thumbnail-count"
                                                                    title={_(followers)
                                                                        .filter((o, index) => {
                                                                            return index > 4;
                                                                        })
                                                                        .map(({ user }) => {
                                                                            return user.firstName + " " + user.lastName;
                                                                        })
                                                                        .value()
                                                                        .join("\r\n")}
                                                                >
                                                                    +{followers.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Approver:</label>
                                                        {approver.length > 0 ? (
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
                                                                );
                                                            })
                                                        ) : (
                                                            <p class="m0">N/A</p>
                                                        )}
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Due Date:</label>
                                                        <div>
                                                            <p class={`${daysRemaining < 0 && status != "Completed" ? "text-red mb0" : "mb0"}`}>{dueDate != null ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"}</p>
                                                        </div>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Status:</label>
                                                        <div>
                                                            <p class={`m0 ${status == "Completed" ? "text-green" : status == "For Approval" ? "text-orange" : ""}`}>{status}</p>
                                                            {daysRemaining < 0 && status != "Completed" && <p class="note text-red m0">Delayed</p>}
                                                        </div>
                                                    </div>
                                                    <div class={task_dependency.length == 0 ? "label-div" : ""}>
                                                        <label>Dependency:</label>
                                                        {task_dependency.length == 0 && <p class="m0">N/A</p>}
                                                        <div class="ml20">
                                                            {_.map(task_dependency, ({ task, dependencyType }, index) => {
                                                                return (
                                                                    <div key={index}>
                                                                        <p class="m0">{task.task}</p>
                                                                        <p class="note text-blue">{dependencyType}</p>
                                                                    </div>
                                                                );
                                                            })}
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
                                                        <h3>Attachments</h3>
                                                        <div>
                                                            {_.map(documentList, (params, index) => {
                                                                const { id, origin, name, child = [], isRead, user, dateAdded, documentNameCount } = params;
                                                                const documentName = `${origin}${documentNameCount > 0 ? `(${documentNameCount})` : ``}`;
                                                                const duration = moment.duration(moment().diff(moment(dateAdded)));
                                                                const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
                                                                const editFilename = typeof document.Selected.file_name != "undefined" ? document.Selected.file_name : "";
                                                                let checklistTagged = [];
                                                                if (document.Selected.id == id) {
                                                                    checklistTagged = _.map(document.Selected.child, ({ id, description }) => {
                                                                        return { value: id, label: description };
                                                                    });
                                                                }

                                                                return (
                                                                    <div key={index}>
                                                                        <div class="display-flex vh-center mb5 pd10 attachment">
                                                                            {document.Selected.action == "RENAME" && document.Selected.id == params.id && (
                                                                                <div class="form-group mb5">
                                                                                    <label for="email">Document Name:</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        required=""
                                                                                        name="fileName"
                                                                                        class="form-control"
                                                                                        placeholder="Add Item"
                                                                                        value={editFilename}
                                                                                        onChange={e => {
                                                                                            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, ["file_name"]: e.target.value } });
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <div>
                                                                                <div class={typeof document.Selected.action != "undefined" && document.Selected.action == "RENAME" && document.Selected.id == params.id ? "hide" : ""}>
                                                                                    <p class="m0">
                                                                                        <a data-tip data-for={`attachment-${index}`} onClick={() => this.viewDocument({ id, name: name, origin: documentName, isRead: isRead.length, user })}>
                                                                                            {documentName.substring(0, 50)}
                                                                                            {documentName.length > 50 ? "..." : ""}
                                                                                        </a>
                                                                                    </p>
                                                                                    <p class="note mb0">
                                                                                        Uploaded {date} by {user.firstName + " " + user.lastName}
                                                                                    </p>
                                                                                </div>
                                                                                {document.Selected.action == "TAG" && document.Selected.id == params.id && (
                                                                                    <div class="form-group mb5">
                                                                                        <p class="m0 note">All checklist added or removed will change status.</p>
                                                                                        <DropDown
                                                                                            multiple={true}
                                                                                            required={false}
                                                                                            options={_.map(
                                                                                                _.filter(checklist, o => {
                                                                                                    return o.isDocument == 1;
                                                                                                }),
                                                                                                ({ id, description }) => {
                                                                                                    return { id, name: description };
                                                                                                }
                                                                                            )}
                                                                                            selected={checklistTagged}
                                                                                            onChange={e => {
                                                                                                dispatch({
                                                                                                    type: "SET_DOCUMENT_SELECTED",
                                                                                                    Selected: {
                                                                                                        ...document.Selected,
                                                                                                        child: _.filter(checklist, checklistObj => {
                                                                                                            return (
                                                                                                                _.findIndex(e, ({ value }) => {
                                                                                                                    return value == checklistObj.id;
                                                                                                                }) >= 0
                                                                                                            );
                                                                                                        })
                                                                                                    }
                                                                                                });
                                                                                            }}
                                                                                            placeholder={"Search or select document checklist"}
                                                                                            isClearable={checklist.length > 0}
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {status != "Completed" && user.id == loggedUser.data.id && (
                                                                                <div class="flex-right">
                                                                                    {(((typeof document.Selected.action == "undefined" || document.Selected.action != "RENAME") && document.Selected.id != params.id) ||
                                                                                        document.Selected.action == "DELETE") && (
                                                                                        <div>
                                                                                            <a href="javascript:void(0);" onClick={e => this.deleteDocument(params)} class="btn btn-action">
                                                                                                <span class="fa fa-trash" />
                                                                                            </a>
                                                                                            <a href="javascript:void(0);" onClick={e => this.editDocument(params)} class="btn btn-action">
                                                                                                <span class="fa fa-pencil" />
                                                                                            </a>
                                                                                            <a href="javascript:void(0);" onClick={e => this.tagChecklist(params)} class="btn btn-action">
                                                                                                <span class="fa fa-tags" />
                                                                                            </a>
                                                                                        </div>
                                                                                    )}
                                                                                    {typeof document.Selected.action != "undefined" && document.Selected.id == params.id && document.Selected.action != "DELETE" && (
                                                                                        <div>
                                                                                            <a
                                                                                                href="javascript:void(0);"
                                                                                                onClick={() => {
                                                                                                    if (document.Selected.action != "RENAME") {
                                                                                                        this.updateDocumentChecklist();
                                                                                                    } else {
                                                                                                        this.renameDocument(params);
                                                                                                    }
                                                                                                }}
                                                                                                class="btn btn-action"
                                                                                            >
                                                                                                <span class="fa fa-check" />
                                                                                            </a>
                                                                                            <a
                                                                                                href="javascript:void(0);"
                                                                                                onClick={() => {
                                                                                                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                                                                                                }}
                                                                                                class="btn btn-action"
                                                                                            >
                                                                                                <span class="fa fa-close" />
                                                                                            </a>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {child.length > 0 && (
                                                                            <ReactTooltip id={`attachment-${index}`} aria-haspopup="true" type={"light"} class="updates-tooltip">
                                                                                <div class="wrapper">
                                                                                    <div class="header">
                                                                                        <p class="text-left m0">
                                                                                            <strong>Checklist</strong>
                                                                                        </p>
                                                                                    </div>
                                                                                    {_.map(child, ({ description }, key) => {
                                                                                        return (
                                                                                            <div key={key}>
                                                                                                <div class="list">
                                                                                                    <p class="m0 text-left title">
                                                                                                        {description.substring(0, 30)}
                                                                                                        {description.length > 30 ? "..." : ""}
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </ReactTooltip>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {(typeof documentList == "undefined" || documentList.length == 0) && (
                                                                <p class="mb0 text-center">
                                                                    <strong>No Records Found</strong>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-12 bb pb20">
                                                    <div>
                                                        <h3 class="mb0">Checklist</h3>
                                                        {status != "Completed" && (
                                                            <p class="mb10">
                                                                <a
                                                                    onClick={() => {
                                                                        $(`#task-documents`).modal("show");
                                                                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, ["document_type"]: "checklist_document" } });
                                                                    }}
                                                                >
                                                                    Upload Checklist Document
                                                                </a>
                                                            </p>
                                                        )}
                                                        <div id="checklist">
                                                            {_.map(
                                                                _.sortBy(checklist, function(o) {
                                                                    return new moment(o.dateAdded);
                                                                }).reverse(),
                                                                (checklistObj, index) => {
                                                                    const { id, isCompleted, isDocument, description, user, dateAdded } = { ...checklistObj };
                                                                    const duration = moment.duration(moment().diff(moment(dateAdded)));
                                                                    const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());

                                                                    return (
                                                                        <div key={index} class="display-flex vh-center checklist-item">
                                                                            <label class={status != "Completed" ? "custom-checkbox todo-checklist" : "todo-checklist"}>
                                                                                {description}
                                                                                <p class="note mb0">
                                                                                    Added {date} by {user.firstName + " " + user.lastName}.
                                                                                </p>
                                                                                {isDocument == 1 && <span class="label label-success">Document</span>}
                                                                                {status != "Completed" && (
                                                                                    <div>
                                                                                        <input type="checkbox" checked={isCompleted ? true : false} onChange={() => {}} onClick={() => this.completeChecklist(id)} />
                                                                                        <span class="checkmark" />
                                                                                    </div>
                                                                                )}
                                                                            </label>
                                                                            {status != "Completed" && (
                                                                                <a href="javascript:void(0);" onClick={e => this.deleteSubtask(id)} class="btn btn-action flex-right">
                                                                                    <span class="fa fa-trash" />
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                            )}
                                                            {(typeof checklist == "undefined" || checklist.length == 0) && (
                                                                <p class="mb0 text-center">
                                                                    <strong>No Records Found</strong>
                                                                </p>
                                                            )}
                                                            {status != "Completed" && (
                                                                <div class="mt20">
                                                                    <TaskChecklist />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb20">
                                                <Tabs>
                                                    <TabList>
                                                        <Tab>Activities</Tab>
                                                        <Tab>Time Tracking</Tab>
                                                    </TabList>
                                                    <TabPanel>
                                                        <div class="ml10 mt20 detail-tabs">
                                                            <div>
                                                                {activityList.length > 0 && (
                                                                    <div>
                                                                        {_.map(_.sortBy(activityList, "dateAdded").reverse(), (log, index) => {
                                                                            return <div key={index}>{this.renderActivityLogs(log)}</div>;
                                                                        })}
                                                                    </div>
                                                                )}
                                                                {activityList.length == 0 && (
                                                                    <p class="mb0 text-center">
                                                                        <strong>No Records Found</strong>
                                                                    </p>
                                                                )}
                                                                {(currentActivityLogPage != lastActivityLogPage || currentConversationLogPage != lastConversationLogPage) && (
                                                                    <p class="m0 text-center">
                                                                        <a onClick={() => this.getNextActivityLogs()}>Load More Activities</a>
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div class="ml20 mt20 mb20">
                                                                <div class="form-group mention">
                                                                    {commentType != "" && (
                                                                        <div>
                                                                            <p class="m0 note">
                                                                                Replying to a comment
                                                                                <a
                                                                                    onClick={() => {
                                                                                        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...conversation.Selected, type: "" } });
                                                                                    }}
                                                                                >
                                                                                    <i class="fa fa-times ml5" aria-hidden="true" />
                                                                                </a>
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    <MentionsInput
                                                                        value={commentText}
                                                                        onChange={this.handleChange.bind(this, "comment")}
                                                                        style={defaultStyle}
                                                                        classNames={{
                                                                            mentions__input: "form-control"
                                                                        }}
                                                                        placeholder={"Type your comment"}
                                                                        markup="{[__display__](__id__)}"
                                                                        inputRef={input => {
                                                                            this.mentionInput = input;
                                                                        }}
                                                                    >
                                                                        <Mention trigger="@" data={this.renderUsers} appendSpaceOnAdd={true} style={{ backgroundColor: "#ecf0f1", padding: 1 }} />
                                                                    </MentionsInput>
                                                                    {commentText != "" && (
                                                                        <a class="btn btn-violet mt10" onClick={this.addComment} disabled={conversation.Loading == "SUBMITTING"}>
                                                                            <span>{conversation.Loading == "SUBMITTING" ? "Sending ..." : "Submit Comment"}</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TabPanel>
                                                    <TabPanel>
                                                        <div class="ml10 mt20 detail-tabs">
                                                            <h3>
                                                                Total Time: {totalHoursValue} Hour{totalHoursValue > 1 ? "s" : ""}
                                                            </h3>
                                                            <div>
                                                                {_.map(tasktimeLog.List, (taskTimeLogObj, index) => {
                                                                    const { time, description, dateAdded, user, period } = { ...taskTimeLogObj };
                                                                    const duration = moment.duration(moment().diff(moment(dateAdded)));
                                                                    const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());

                                                                    return (
                                                                        <div key={index} class="log-time">
                                                                            <div class="display-flex vh-center">
                                                                                <p class="mb0 note">Logged Time:</p>
                                                                                <p class="mb0 ml10">{time + " " + period}</p>
                                                                            </div>
                                                                            <div class="display-flex vh-center">
                                                                                <p class="mb0 note">Description:</p>
                                                                                <p class="mb0 ml10">{description}</p>
                                                                            </div>
                                                                            <p class="note mb0">
                                                                                Added {date} by {user.firstName + " " + user.lastName}.
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {tasktimeLog.List.length == 0 && (
                                                                    <p class="mb0 text-center">
                                                                        <strong>No Records Found</strong>
                                                                    </p>
                                                                )}
                                                                {tasktimeLog.Count.current_page != tasktimeLog.Count.last_page && (
                                                                    <p class="m0 text-center">
                                                                        <a onClick={() => this.getNextTimeLogs()}>Load More Timelogs</a>
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TabPanel>
                                                </Tabs>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DeleteModal id="delete-task" type={"task"} type_value={typeValue} delete_function={this.confirmDelete} />
                <DeleteModal id="delete-document" type={"task document"} type_value={documentValue} delete_function={this.confirmDeleteDocument} />
                <DocumentViewerModal />
                <div class="modal fade" id="task-documents" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <a
                                    class="text-grey"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => {
                                        dispatch({ type: "SET_DOCUMENT_FILES", Files: "" });
                                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                                    }}
                                >
                                    <span>
                                        <i class="fa fa-chevron-left mr10" aria-hidden="true" />
                                        <strong>Back</strong>
                                    </span>
                                </a>
                            </div>
                            <div class="modal-body">
                                <TaskDocument />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="task-time" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-md">
                        <div class="modal-content">
                            <div class="modal-header">
                                <a class="text-grey" data-dismiss="modal" aria-label="Close">
                                    <span>
                                        <i class="fa fa-chevron-left mr10" aria-hidden="true" />
                                        <strong>Back</strong>
                                    </span>
                                </a>
                            </div>
                            <div class="modal-body">
                                <TaskTimeLog />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
