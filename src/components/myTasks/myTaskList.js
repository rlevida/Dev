import React from "react";
import { connect } from "react-redux";

import TaskFilter from "./taskFilter";
import TaskListCategory from "./taskListCategory";
import { TaskDetails } from "./taskDetails";

import { putData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        task: store.task
    }
})
export default class myTaskList extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "handleAction",
            "completeChecklist"
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
                    dueDate: moment(dueDate).format("YYYY MMM DD")
                };
                dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
                dispatch({ type: "SET_TASK_SELECTED", Selected: toBeUpdatedObject });
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

    render() {
        const { task } = { ...this.props };

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
                            <div>
                                <TaskListCategory date="Succeeding month" />
                            </div>
                        </div>
                    </div>
                </div>
                <TaskDetails
                    task={task}
                    handleAction={this.handleAction}
                    completeChecklist={this.completeChecklist}
                />
            </div>
        );
    }
}