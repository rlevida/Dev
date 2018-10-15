import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment';
import TaskStatus from './taskStatus'
import ApprovalModal from './approvalModal'
import _ from "lodash";
import TaskComponent from '../taskComponent'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        global: store.global
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
        let { socket, global, loggedUser } = this.props;
        let intervalLoggedUser = setInterval(() => {
            if (typeof this.props.loggedUser.data.id != "undefined") {
                let userFollowedTasks = global.SelectList.userFollowedTasks
                    .filter((e, index) => { return e.userTypeLinkId == this.props.loggedUser.data.id })
                    .map((e, index) => { return e.linkId })
                let taskListId = _.merge(userFollowedTasks, this.props.loggedUser.data.taskIds)
                let filter = { filter: { id: { name: "id", value: taskListId, condition: " IN " } } }
                this.props.socket.emit("GET_TASK_LIST", filter);
                clearInterval(intervalLoggedUser)
            }
        }, 1000)
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "userFollowedTasks", filter: { linkType: 'task', memberType: "Follower" } })
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: {} });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
    }

    updateActiveStatus(data, approvalRequired, workstreamId, taskData) {
        let { socket, dispatch } = this.props;
        if (approvalRequired) {
            socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "workstreamMemberList", filter: { id: workstreamId } })
            dispatch({ type: "SET_TASK_SELECTED", Selected: taskData })
            $(`#approvalModal`).modal("show")
        } else {
            socket.emit("SAVE_OR_UPDATE_TASK", { data: { ...data, status: "Completed", action: "complete" } })
        }
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
            className = "fa fa-exclamation-circle";
            statusColor = "#c0392b"
        }

        return (
            <span className={className} style={{ color: statusColor }}></span>
        );
    }

    render() {
        let { task, socket, loggedUser } = this.props;
        let taskList = _(task.List)
            .map((o) => {
                return { ...o, due_date_int: moment(o.dueDate).format('YYYYMMDD') }
            })
            .filter(e => { return typeof e != "undefined" && e.status != "Completed" })
            .orderBy(['due_date_int'], ['asc'])
            .value();
        return (
            <div>
                <TaskStatus style={{ float: "right", padding: "20px" }} />
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th></th>
                            <th class="text-left">Project</th>
                            <th class="text-left">Workstream</th>
                            <th class="text-left">Task Name</th>
                            <th class="text-center">Due Date</th>
                            <th class="text-center">Assigned</th>
                            <th class="text-center"></th>
                        </tr>
                        {
                            (taskList.length == 0) &&
                            <tr>
                                <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            taskList.map((data, index) => {
                                let taskStatus = 0;
                                let dueDate = moment(data.dueDate);
                                let currentDate = moment(new Date());

                                if (dueDate.diff(currentDate, 'days') < 0 && data.status != 'Completed') {
                                    taskStatus = 2
                                } else if (dueDate.diff(currentDate, 'days') == 0 && data.status != 'Completed') {
                                    taskStatus = 1
                                }

                                return (
                                    <tr key={index}>
                                        <td>
                                            {this.renderStatus({ ...data, taskStatus })}
                                        </td>
                                        <td class="text-left">{data.project_project}</td>
                                        <td class="text-left">{data.workstream_workstream}</td>
                                        <td class="text-left"><a href={`/project/${data.projectId}/workstream/${data.workstreamId}?task=${data.id}`}>{data.task}</a></td>
                                        <td class="text-center">{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td class="text-center">{(data.assignedById) ? <span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span> : ""}</td>
                                        <td class="text-left">
                                            {
                                                (typeof loggedUser.data != 'undefined' && loggedUser.data.userType != 'External' && loggedUser.data.userRole < 4) && <div>
                                                    <a href="javascript:void(0);" data-tip="EDIT"
                                                        onClick={(e) => {
                                                            socket.emit("GET_TASK_DETAIL", { id: data.id, action: 'edit' })
                                                        }}
                                                        class="btn btn-info btn-sm">
                                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                                    <a href="javascript:void(0);" data-tip="DELETE"
                                                        onClick={e => this.deleteData(data.id)}
                                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                        <span class="glyphicon glyphicon-trash"></span></a>

                                                    {
                                                        (
                                                            (data.status == null || data.status == "In Progress" || data.status == "")
                                                            &&
                                                            (typeof data.isActive == 'undefined' || data.isActive == 1)
                                                        ) && <a href="javascript:void(0);" data-tip="COMPLETE"
                                                            onClick={e => this.updateActiveStatus({ id: data.id, periodTask: data.periodTask }, data.approvalRequired, data.workstreamId, data)}
                                                            class="btn btn-success btn-sm ml10">
                                                            <span class="glyphicon glyphicon-check"></span></a>
                                                    }
                                                </div>
                                            }
                                            <Tooltip />
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                <ApprovalModal />
            </div>
        )
    }
}