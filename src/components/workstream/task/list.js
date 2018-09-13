import React from "react";
import Tooltip from "react-tooltip";
import { Loading } from "../../../globalComponents";
import moment from 'moment'
import Form from "./form"
import _ from "lodash";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        let taskListInterval = setInterval(() => {
            if (this.props.workstream.Selected.id) {
                this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: this.props.workstream.Selected.id } });
                clearInterval(taskListInterval)
            }
        }, 1000)
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_TASK_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_TASK", { id: id })
        }
    }

    selectedTask(data) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_TASK_SELECTED", Selected: data })
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })
    }

    renderStatus(data) {
        const { isActive, taskStatus } = { ...data };
        let className = "";
        let statusColor = "#000";

        if (data.status == "Completed") {
            className = "fa fa-circle"
            statusColor = "#27ae60"
        } else if (isActive == 0) {
            className = "fa fa-circle";
        } else if (taskStatus == 0) {
            className = "fa fa-circle";
            statusColor = "#27ae60"
        } else if (taskStatus == 1) {
            className = "fa fa-circle";
            statusColor = "#f39c12"
        } else if (taskStatus == 2) {
            className = "fa fa-circle";
            statusColor = "#c0392b"
        }

        return (
            <span className={className} style={{ color: statusColor }}></span>
        );
    }

    render() {
        let { task } = this.props;

        return (
            <div class={(task.FormActive=="Form"?"col-md-8":"row") + " pd20"}>
                <h3 class="m0">Tasks</h3>
                <table id="dataTable" class="table responsive-table mt30">
                    <tbody>
                        <tr>
                            <th></th>
                            <th class="text-left">Task Name</th>
                            <th class="text-center">Due Date</th>
                            <th class="text-center">Assigned</th>
                            <th class="text-center">Followed By</th>
                            <th class="text-center"></th>
                        </tr>
                        {
                            (task.List.length > 0 && !task.Loading) &&
                            _.orderBy(task.List, ['dueDate', 'asc']).map((data, index) => {

                                let taskStatus = 0;
                                let dueDate = moment(data.dueDate);
                                let currentDate = moment(new Date());

                                if (dueDate.diff(currentDate, 'days') < 0) {
                                    taskStatus = 2
                                } else if (dueDate.diff(currentDate, 'days') == 0) {
                                    taskStatus = 1
                                }

                                return (
                                    <tr key={index} style={{ cursor: "pointer" }} onClick={() => this.selectedTask(data)}>
                                        <td>{this.renderStatus({ ...data, taskStatus })}</td>
                                        <td class="text-left">{data.task}</td>
                                        <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td>{(data.assignedById) ? <span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span> : ""}</td>
                                        <td>
                                            {(data.followersName != null) &&
                                                <div>
                                                    <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                                    <Tooltip id={`follower${index}`}>
                                                        {data.followersName.split(",").map(e => {
                                                            return <p>{e != null ? e : ""} <br /></p>
                                                        })}
                                                    </Tooltip>
                                                </div>
                                            }
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                {
                    (task.Loading) && <Loading />
                }
                {
                    (task.List.length == 0 && task.Loading == false) && <p class="text-center">No Record Found!</p>
                }
            </div>
        );
    }
}