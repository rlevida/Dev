import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import _ from "lodash";

import { getData } from '../../../globalFunction';

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})

export default class TaskStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        const fetchUrl = `/api/task/myTaskStatus?projectId=${project}&date=${moment(new Date()).format("YYYY-MM-DD")}&userId=${loggedUser.data.id}`;

        getData(fetchUrl, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    render() {
        const { task } = this.props;
        const { StatusCount } = task;

        return (
            <div class="container-fluid">
                {
                    (_.isEmpty(StatusCount) == false) &&
                    <div class="row single-status">
                        <div class="col-lg-4 col-xs-12 active-count count">
                            <span class="text-white">{StatusCount.assigned_active}</span>
                            <span class="text-white">Active Tasks:</span>
                        </div>
                        <div class="col-lg-4 col-xs-12 on-time count">
                            <span class="text-white">{StatusCount.assigned_active - StatusCount.assigned_issues}</span>
                            <span class="text-white">Tasks On Time:</span>
                        </div>
                        <div class="col-lg-4 col-xs-12 issues count">
                            <span class="text-white">
                                {(StatusCount.assigned_issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                                {StatusCount.assigned_issues}
                            </span>
                            <span class="text-white">Tasks With Issues:</span>
                        </div>
                    </div>
                }
            </div>
        );
    }
}