import React from "react"
import ReactDOM from "react-dom"

import { showToast, getData } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser
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

        return <div class="container-fluid">
            <div className={(page == "mytask") ? "row status-multiple" : "row"}>
                <div class="col-lg-2 col-xs-12 count">
                    <span>Assigned:</span>
                </div>
                <div class="col-lg-3 col-xs-12 active-count count">
                    <span class="text-white">{StatusCount.assigned_active}</span>
                    <span class="text-white">Active Tasks:</span>
                </div>
                <div class="col-lg-3 col-xs-12 on-time count">
                    <span class="text-white">
                        {StatusCount.assigned_due_today}
                    </span>
                    <span class="text-white">Tasks On Time:</span>
                </div>
                <div class="col-lg-3 col-xs-12 issues count">
                    <span class="text-white">
                        {(StatusCount.assigned_issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                        {StatusCount.assigned_issues}
                    </span>
                    <span class="text-white">Tasks With Issues:</span>
                </div>
            </div>
            <div className={(page == "mytask") ? "row status-multiple" : "row"}>
                <div class="col-lg-2 col-xs-12 count">
                    <span>Responsible:</span>
                </div>
                <div class="col-lg-3 col-xs-12 active-count count">
                    <span class="text-white">{StatusCount.responsible_active}</span>
                    <span class="text-white">Active Tasks:</span>
                </div>
                <div class="col-lg-3 col-xs-12 on-time count">
                    <span class="text-white">
                        {StatusCount.responsible_due_today}
                    </span>
                    <span class="text-white">Tasks On Time:</span>
                </div>
                <div class="col-lg-3 col-xs-12 issues count">
                    <span class="text-white">
                        {(StatusCount.responsible_due_today > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                        {StatusCount.responsible_due_today}
                    </span>
                    <span class="text-white">Tasks With Issues:</span>
                </div>
            </div>
            <div className={(page == "mytask") ? "row status-multiple" : "row"}>
                <div class="col-lg-2 col-xs-12 count">
                    <span>Following:</span>
                </div>
                <div class="col-lg-3 col-xs-12 active-count count">
                    <span class="text-white">{StatusCount.followed_active}</span>
                    <span class="text-white">Active Tasks:</span>
                </div>
                <div class="col-lg-3 col-xs-12 on-time count">
                    <span class="text-white">
                        {StatusCount.followed_due_today}
                    </span>
                    <span class="text-white">Tasks On Time:</span>
                </div>
                <div class="col-lg-3 col-xs-12 issues count">
                    <span class="text-white">
                        {(StatusCount.followed_issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                        {StatusCount.followed_issues}
                    </span>
                    <span class="text-white">Tasks With Issues:</span>
                </div>
            </div>
        </div>
    }
}