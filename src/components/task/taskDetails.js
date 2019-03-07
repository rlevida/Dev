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
            "handleAction",
            "confirmDelete"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        })
    }

    handleAction(type) {
        const { dispatch } = { ...this.props };
        const { task } = { ...this.props };
        const { dueDate, startDate } = task.Selected;

        switch (type) {
            case "edit":
                const toBeUpdatedObject = {
                    ...task.Selected,
                    dueDate: (dueDate != null) ? moment(dueDate).format("YYYY MMM DD") : null,
                    startDate: (startDate != null) ? moment(startDate).format("YYYY MMM DD") : null
                };

                dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
                dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
                break;
            case "delete":
                $(`#delete-task`).modal("show");
                break;
            case "status":
                this.completeTask();
                break;
            case "starred":
                this.starredTask();
                break;
            default:
        }
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

    completeTask() {
        const { task, dispatch, loggedUser } = { ...this.props };
        const { Selected } = task;
        const { status, periodTask, periodic, id } = Selected;
        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: "Completed" }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, status: "Completed" } });
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

    render() {
        const { task: taskObj } = { ...this.props };
        const { Loading, Selected } = taskObj;
        const { id, task, task_members, dueDate, workstream, status, description, checklist } = Selected;
        const assigned = _.filter(task_members, (o) => { return o.memberType == "assignedTo" });
        const approver = _.filter(task_members, (o) => { return o.memberType == "approver" });
        const typeValue = (typeof Selected.task != "undefined" && _.isEmpty(Selected) == false) ? Selected.task : "";

        return (
            <div>
                <div class="modal right fade" id="task-details">
                    <div class="modal-dialog" role="document">
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
                                        {
                                        ((typeof Selected.approverId != "undefined" || Selected.status != "For Approval") && Selected.status != "Completed") &&
                                        <a class="btn btn-default" onClick={() => this.handleAction("status")}>
                                            <span>
                                                <i class={`fa mr10 ${(Selected.status != "Completed") ? "fa-check" : "fa-ban"}`} aria-hidden="true"></i>
                                                {`${(Selected.status == "For Approval") ? "Approve" : (Selected.status == "Completed") ? "Uncomplete" : "Complete"}`}
                                            </span>
                                        </a>
                                    }

                                    </div>
                                    <div class="col-md-6">
                                        <div class="button-action">
                                            <a class="logo-action text-grey" onClick={() => this.handleAction("starred")}>
                                                <i title="FAVORITE" class={`fa ${Selected.isStarred ? "fa-star text-yellow" : "fa-star-o"}`} aria-hidden="true"></i>
                                            </a>
                                            <a data-dismiss="modal" onClick={() => this.handleAction("edit")} class="logo-action text-grey"><i title="EDIT" class="fa fa-pencil" aria-hidden="true"></i></a>
                                            <a data-dismiss="modal" onClick={() => this.handleAction("delete")} class="logo-action text-grey"><i title="DELETE" class="fa fa-trash-o" aria-hidden="true"></i></a>
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
                                                                    _.map(assigned, (member, index) => {
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
                                                                ((checklist).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
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