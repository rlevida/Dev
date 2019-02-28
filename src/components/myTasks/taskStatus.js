import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { getData } from '../../globalFunction'

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        project: store.project
    }
})

export default class TaskStatus extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;

        getData(`/api/task/myTaskStatus?&userId=${loggedUser.data.id}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    render() {
        const { task } = this.props;
        const { StatusCount } = task;
       
        return (
            <div class={(_.isEmpty(StatusCount)) ? "linear-background" : ""}>
                {
                    (_.isEmpty(StatusCount) == false) && <div class="row content-row status-count">
                        <div class="col-lg-6 text-center">
                            <p class="status-count text-orange">{('0' + StatusCount.assigned_active).slice(-2)}</p>
                            <p class="status-label">Assigned to me</p>
                            <p class="status-sublabel"> {`for ${StatusCount.project_count} Project(s)`}</p>
                            <p class="status-sublabel text-red">{(StatusCount.assigned_issues > 0) ? StatusCount.assigned_issues : 'No'} delayed tasks</p>
                        </div>
                        <div class="col-lg-6 text-center">
                            <p class="status-count text-yellow">{('0' + StatusCount.followed_active).slice(-2)}</p>
                            <p class="status-label">Task followed</p>
                            <p class="status-sublabel"> {`for ${StatusCount.project_count} Project(s)`}</p>
                            <p class="status-sublabel text-red">{(StatusCount.followed_issues > 0) ? StatusCount.followed_issues : 'No'} delayed tasks</p>
                        </div>
                    </div>
                }
            </div>
        );
    }
}