import React from "react";
import { connect } from "react-redux";

import Header from "../partial/header";
import MyTaskList from "./myTaskList";
import TaskForm from "../task/taskForm";

@connect((store) => {
    return {
        task: store.task,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { task } = this.props;
        const component = <div>
            {
                (task.FormActive == "List") && <MyTaskList />
            }
            {
                (task.FormActive == "Form") && <TaskForm />
            }
        </div>
        return (
            <Header component={component} page={"My Tasks"} />
        )
    }
}