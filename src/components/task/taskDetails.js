import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import { putData, postData, deleteData, showToast } from "../../globalFunction";
import { DeleteModal } from "../../globalComponents";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
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
            "followTask"
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
        const { checklist = [] } = task.Selected;
        const updateIndex = _.findIndex(checklist, { id });
        const getSelectedChecklist = _.find(checklist, (o) => o.id == id);
        const isCompleted = (getSelectedChecklist.isCompleted == 0) ? 1 : 0;
        const updatedChecklistObj = { ...getSelectedChecklist, isCompleted };

        putData(`/api/checklist/${id}`, updatedChecklistObj, (c) => {
            if (c.status == 200) {
                checklist.splice(updateIndex, 1, updatedChecklistObj);
                const toBeUpdatedObject = {
                    ...task.Selected,
                    checklist
                };
                dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
                showToast("success", "Checklist successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });

    }

    completeTask(status) {
        const { task, dispatch, loggedUser } = { ...this.props };
        const { Selected } = task;
        const { periodTask, periodic, id } = Selected;
        const taskStatus = status;

        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: taskStatus }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
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
        const { loggedUser, task, dispatch } = this.props;
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
                    task_members.push(c.data);
                    dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, task_members } });
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
                    const followingTasks = _.remove(task.List, (o) => {
                        return o.id != remainingMembers[0].linkId;
                    });
                    dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, task_members: remainingMembers } });
                    dispatch({ type: "SET_TASK_LIST", list: followingTasks });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("success", "Something went wrong. Please try again later.");
                }
            });
        }
    }

    render() {
        const { task: taskObj, loggedUser } = { ...this.props };
        const { Loading, Selected } = taskObj;
        const { id, task, task_members, dueDate, workstream, status, description, checklist } = Selected;
        const assigned = _.filter(task_members, (o) => { return o.memberType == "assignedTo" });
        const isAssignedToMe = _.find(task_members, (o) => { return o.memberType == "assignedTo" && o.user.id == loggedUser.data.id });
        const approver = _.filter(task_members, (o) => { return o.memberType == "approver" });
        const isFollower = _.find(task_members, (o) => { return o.memberType == "follower" && o.user.id == loggedUser.data.id }) || {};
        const typeValue = (typeof Selected.task != "undefined" && _.isEmpty(Selected) == false) ? Selected.task : "";

        return (
            <div>
                <div class="modal right fade" id="task-details">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <a class="text-grey" data-dismiss="modal" aria-label="Close">
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
                                            <h2 class="mt20 mb20">{task}</h2>
                                            <div class="row mb20">
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Assigned:</label>
                                                        <p class="m0">
                                                            {
                                                                _.map(assigned, (member, index) => {
                                                                    const { user } = member;
                                                                    return (
                                                                        <span key={index}>{user.firstName + " " + user.lastName}</span>
                                                                    )
                                                                })
                                                            }
                                                        </p>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Project:</label>
                                                        <p class="m0 text-green">
                                                            <strong>{workstream.project.project}</strong>
                                                        </p>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Workstream:</label>
                                                        <p class="m0">
                                                            {workstream.workstream}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <div class="label-div">
                                                        <label>Approver:</label>
                                                        <p class="m0">
                                                            {
                                                                (approver.length > 0) ?
                                                                    _.map(approver, (member, index) => {
                                                                        const { user } = member;
                                                                        return (
                                                                            <span key={index}>{user.firstName + " " + user.lastName}</span>
                                                                        )
                                                                    }) : "N/A"
                                                            }
                                                        </p>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Due Date:</label>
                                                        <p class="m0">
                                                            {
                                                                (dueDate != null) ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"
                                                            }
                                                        </p>
                                                    </div>
                                                    <div class="label-div">
                                                        <label>Status:</label>
                                                        <p class="m0">
                                                            {
                                                                status
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb20">
                                                <div class="col-md-12">
                                                    <div class="bb pb50">
                                                        <p class="m0">{description}</p>
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
                                                            Attachments
                                                </h3>
                                                        <div class="ml20">

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
            </div>
        )
    }
}