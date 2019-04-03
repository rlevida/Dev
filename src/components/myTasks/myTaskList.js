import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import TaskListCategory from "../task/taskListCategory";

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
                <div class="mt20 mb20">
                    <TaskListCategory date="Today" user_id={loggedUser.data.id} />
                </div>
                <div class="mb20">
                    <TaskListCategory date="This week" user_id={loggedUser.data.id} />
                </div>
                <div class="mb20">
                    <TaskListCategory date="This month" user_id={loggedUser.data.id} />
                </div>
                <div class="mb20">
                    <TaskListCategory date="Succeeding month" user_id={loggedUser.data.id} />
                </div>
            </div>
        );
    }
}