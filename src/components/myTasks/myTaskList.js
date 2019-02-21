import React from "react";
import { connect } from "react-redux";

import TaskFilter from "./taskFilter";
import TaskListCategory from "./taskListCategory";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class myTaskList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="mb20 bd">
                            <TaskFilter />
                        </div>
                        <div class="mt40 mb40">
                            <TaskListCategory date="Today" />
                        </div>
                        <div class="mb40">
                            <TaskListCategory date="This week" />
                        </div>
                        <div>
                            <TaskListCategory date="This month" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}