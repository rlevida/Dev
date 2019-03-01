import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import TaskFilter from "./taskFilter";
import TaskListCategory from "./taskListCategory";
import { TaskDetails } from "../task/taskDetails";

import { putData, postData, deleteData, showToast } from "../../globalFunction";
import { DeleteModal } from "../../globalComponents";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class myTaskList extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "handleAction",
            "completeChecklist",
            "completeTask",
            "confirmDelete",
            "starredTask"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleAction(type) {
        const { dispatch } = { ...this.props };
        const { task } = { ...this.props };
        const { dueDate } = task.Selected;

        switch (type) {
            case "edit":
                const toBeUpdatedObject = {
                    ...task.Selected,
                    dueDate: (dueDate != null) ? moment(dueDate).format("YYYY MMM DD") : null
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

    completeTask() {
        const { task, dispatch } = { ...this.props };
        const { Selected } = task;
        const status = (Selected.status == "For Approval" || Selected.status == "Completed") ? "In Progress" : "Completed";

        putData(`/api/task/${Selected.id}`, { ...Selected, status }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, status } });
                showToast("success", "Task successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
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
        const { task, loggedUser } = { ...this.props };
        const typeValue = (typeof task.Selected.task != "undefined" && _.isEmpty(task.Selected) == false) ? task.Selected.task : "";

        return (
            <div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card">
                            <div class="mb20 bb">
                                <TaskFilter />
                            </div>
                            <div class="mt40 mb40">
                                <TaskListCategory date="Today" />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="This week" />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="This month" />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="Succeeding month" />
                            </div>
                            <div>
                                <TaskListCategory />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Modals */}
                <TaskDetails
                    task={task}
                    handleAction={this.handleAction}
                    completeChecklist={this.completeChecklist}
                    isApprover={(typeof task.Selected.approverId != "undefined") ? loggedUser.data.id == task.Selected.approverId : false}
                />
                <DeleteModal
                    id="delete-task"
                    type={'task'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
            </div>
        );
    }
}