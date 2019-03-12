import React from "react";
import { connect } from "react-redux";

import MyTaskList from "./myTaskList";
import MyTaskFilters from "./myTaskFilters";
import TaskForm from "../task/taskForm";
import TaskDetails from "../task/taskDetails";
import TaskCalendar from "../task/taskCalendar";

@connect((store) => {
    return {
        task: store.task,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
    }

    render() {
        const { task } = this.props;

        return (
            <div>
                {
                    (task.FormActive == "Form") && <TaskForm />
                }
                {
                    (task.FormActive == "List" || task.FormActive == "Calendar") && <div class="row">
                        <div class="col-lg-12">
                            <div class="card">
                                <div class="mb20 bb">
                                    <MyTaskFilters />
                                </div>
                                {
                                    (task.FormActive == "List") && <MyTaskList />
                                }
                                {
                                    (task.FormActive == "Calendar") && <TaskCalendar is_card={false}/>
                                }
                            </div>
                        </div>
                    </div>
                }
                <TaskDetails />
            </div>
        )
    }
}