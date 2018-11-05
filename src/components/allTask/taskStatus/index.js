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

        getData(`/api/task/myTaskStatus?projectId=${project}&userId=${loggedUser.data.id}&type=myTask&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    render() {
        const { task, style } = this.props;
        const { StatusCount } = task;

        return <div style={style}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Assigned</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{StatusCount.assigned_active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{StatusCount.assigned_due_today}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{StatusCount.assigned_issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Responsible</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{StatusCount.responsible_active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{StatusCount.responsible_due_today}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{StatusCount.responsible_issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Following</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{StatusCount.followed_active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{StatusCount.followed_due_today}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{StatusCount.followed_issues}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    }
}