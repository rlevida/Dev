import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import TaskFilter from "./taskFilter";
import TaskListCategory from "../task/taskListCategory";
import TaskDetails from "../task/taskDetails";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class MyTaskList extends React.Component {
    render() {
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
                <TaskDetails/>
            </div>
        );
    }
}