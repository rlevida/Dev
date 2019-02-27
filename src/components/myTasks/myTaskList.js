import React from "react";
import { connect } from "react-redux";

import TaskFilter from "./taskFilter";
import TaskListCategory from "./taskListCategory";
import { TaskDetails } from "./taskDetails";

@connect((store) => {
    return {
        task: store.task
    }
})
export default class myTaskList extends React.Component {
    constructor(props) {
        super(props);
        this.handleAction = this.handleAction.bind(this);
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
                    actionFunction={this.handleAction}
                />
            </div>
        );
    }
}