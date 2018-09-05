import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment'
import TaskStatus from "./taskStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.renderStatus = this.renderStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "ProjectMemberList", filter: { linkId: project, linkType: "project" } })
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

    renderStatus(data) {
        const { isActive, taskStatus } = { ...data };
        let className = "";
        let statusColor = "#000";

        if (isActive == 0) {
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
        let { task, dispatch, socket, loggedUser } = this.props;

        return <div>

            <TaskStatus style={{ float: "right", padding: "20px" }} />
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })} >
                    <span>New Task</span>
                </li>
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th class="text-left">Workstream</th>
                        <th class="text-left">Task Name</th>
                        <th class="text-center">Due Date</th>
                        <th class="text-center">Assigned</th>
                        <th class="text-center">Followed By</th>
                        <th class="text-center"></th>
                    </tr>
                    {
                        (task.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        task.List.map((data, index) => {
                            let taskStatus = 0;
                            let dueDate = moment(data.dueDate);
                            let currentDate = moment(new Date());

                            if (dueDate.diff(currentDate, 'days') < 0) {
                                taskStatus = 2
                            } else if (dueDate.diff(currentDate, 'days') == 0) {
                                taskStatus = 1
                            }
                            return <tr key={index}>
                                <td>
                                    {this.renderStatus({ ...data, taskStatus })}
                                </td>
                                <td class="text-left">{data.workstream_workstream}</td>
                                <td class="text-left">{data.task}</td>
                                <td class="text-center">{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                <td class="text-center">{(data.assignedById) ? <span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span> : ""}</td>
                                <td class="text-center">
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
                                <td class="text-center">
                                    {
                                        (typeof loggedUser.data != 'undefined' && loggedUser.data.userType != 'External') && <div>
                                            <a href="javascript:void(0);" data-tip="EDIT"
                                                onClick={(e) => socket.emit("GET_TASK_DETAIL", { id: data.id })}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            <Tooltip />
                                        </div>
                                    }
                                    {
                                        (typeof loggedUser.data != 'undefined' && loggedUser.data.userType == 'External') && <div>
                                            <a href="javascript:void(0);" data-tip="VIEW"
                                                onClick={(e) => socket.emit("GET_TASK_DETAIL", { id: data.id, action: 'view' })}
                                                class="btn btn-success btn-sm">
                                                <span class="glyphicon glyphicon-eye-open"></span></a>
                                        </div>
                                    }
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}