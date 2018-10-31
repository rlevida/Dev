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

        getData(`/api/task/status?projectId=${project}&userId=${loggedUser.data.id}&type=myTask&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
           
        });
    }

    render() {
        let { task, loggedUser } = this.props;
        let data = {
            assignedTo: { Active: 0, DueToday: 0, Issues: 0 },
            responsible: { Active: 0, DueToday: 0, Issues: 0 },
            Follower: { Active: 0, DueToday: 0, Issues: 0 }
        }
        if (task.List.length) {
            let userId = loggedUser.data.id;
            task.List.map((e, index) => {
                let dueDate = moment(e.dueDate)
                let currentDate = moment(new Date())

                if (e.assignedById == userId) {
                    data.assignedTo.Active += 1;
                    if (dueDate.diff(currentDate, 'days') == 0) {
                        data.assignedTo.DueToday += 1;
                    } else if (dueDate.diff(currentDate, 'days') < 0) {
                        data.assignedTo.Issues += 1;
                    }
                }
                if (e.followersIds != null && e.followersIds.split(",").includes(`${userId}`)) {
                    data.Follower.Active += 1;
                    if (dueDate.diff(currentDate, 'days') == 0) {
                        data.Follower.DueToday += 1;
                    } else if (dueDate.diff(currentDate, 'days') < 0) {
                        data.Follower.Issues += 1;
                    }
                }

                if (e.responsible_id == userId) {
                    data.responsible.Active += 1;
                    if (dueDate.diff(currentDate, 'days') == 0) {
                        data.responsible.DueToday += 1;
                    } else if (dueDate.diff(currentDate, 'days') < 0) {
                        data.responsible.Issues += 1;
                    }
                }
            })
        }
        return <div style={this.props.style}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Assigned</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.assignedTo.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.assignedTo.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.assignedTo.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Responsible</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.responsible.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.responsible.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.responsible.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Following</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.Follower.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.Follower.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.Follower.Issues}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    }
}