import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import MyTaskFilters from "./myTaskFilters";
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
        const { loggedUser } = this.props;
        
        return (
            <div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card">
                            <div class="mb20 bb">
                                <MyTaskFilters />
                            </div>
                            <div class="mt40 mb40">
                                <TaskListCategory date="Today" user_id={loggedUser.data.id} />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="This week" user_id={loggedUser.data.id} />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="This month" user_id={loggedUser.data.id} />
                            </div>
                            <div class="mb40">
                                <TaskListCategory date="Succeeding month" user_id={loggedUser.data.id} />
                            </div>
                            <div>
                                <TaskListCategory />
                            </div>
                        </div>
                    </div>
                </div>
                <TaskDetails />
            </div>
        );
    }
}