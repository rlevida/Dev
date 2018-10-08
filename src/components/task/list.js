import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment';
import TaskStatus from "./taskStatus"
import _ from "lodash";

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
        let { socket, dispatch } = this.props;
        let intervalLoggedUser = setInterval(() => {
            if (typeof this.props.loggedUser.data.id != "undefined") {
                let filter = { filter: { projectId: project } };
                if (this.props.loggedUser.data.userRole != 1 && this.props.loggedUser.data.userRole != 2) {
                    filter = { filter: { projectId: project, id: { name: "id", value: this.props.loggedUser.data.taskIds, condition: " IN " } } }
                }
                if (typeof this.props.task.Selected.task == "undefined") {
                    socket.emit("GET_TASK_LIST", filter);
                }
                clearInterval(intervalLoggedUser)
            }
        }, 1000)
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "ProjectMemberList", filter: { linkId: project, linkType: "project" } })
    }

    updateActiveStatus(params) {
        let { socket } = this.props;

        socket.emit("SAVE_OR_UPDATE_TASK", { data: { ...params, status: "Completed", action: "complete" } })
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

    setTaskkSelected(data){
        let { dispatch , socket } = this.props;

        dispatch({ type: "SET_TASK_SELECTED", Selected : data})
        dispatch({ type: "SET_TASK_FORM_ACTION" , FormAction: "View"})
        socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "workstreamMemberList" , filter: { id: data.workstreamId  } })
    }

    render() {
        let { task, dispatch, socket, loggedUser } = this.props;
        let taskList = _(task.List)
            .map((o) => {
                let allowToComplete = true;

                if (o.periodic == 1 && o.periodTask != null) {
                    const prevDueDate = moment(o.dueDate).subtract(o.periodType, o.period).format('YYYY-MM-DD');
                    let taskBefore = _.filter((task.List), (e) => {
                        return moment(e.dueDate).format('YYYY-MM-DD') == prevDueDate && (e.periodTask == o.periodTask || e.periodTask == null) && o.status != "Completed"
                    });

                    if (taskBefore.length > 0) {
                        allowToComplete = (taskBefore[0].status == "Completed") ? true : false;
                    }

                }
                return { ...o, due_date_int: moment(o.dueDate).format('YYYYMMDD'), allowToComplete }
            })
            .orderBy(['due_date_int'], ['asc'])
            .value();

        return <div>

            <TaskStatus style={{ float: "right", padding: "20px" }} />
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => { 
                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })
                    dispatch({ type: "SET_TASK_FORM_ACTION", FormAction: "Create" })
                }} 
                >
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
                        <th class="text-left">Status</th>
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
                            let displayedDueDate = dueDate;

                            if (dueDate.diff(currentDate, 'days') < 0 && data.status != 'Completed') {
                                taskStatus = 2
                            } else if (dueDate.diff(currentDate, 'days') == 0 && data.status != 'Completed') {
                                taskStatus = 1
                            }
                            return <tr key={index}>
                                <td>
                                    {this.renderStatus({ ...data, taskStatus })}
                                </td>
                                <td class="text-left">{data.workstream_workstream}</td>
                                <td class="text-left"><a href="javascript:void(0);" onClick={()=> this.setTaskkSelected(data)}>{data.task}</a></td>
                                <td class="text-center">{(data.dueDate != '' && data.dueDate != null) ? moment(displayedDueDate).format('YYYY MMM DD') : ''}</td>
                                <td class="text-center">{(data.assignedById) ? <span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span> : ""}</td>
                                <td class="text-center">
                                    {(data.followersName != null) &&
                                        <div>
                                            <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                            <Tooltip id={`follower${index}`}>
                                                {data.followersName.split(",").map((e, fKey) => {
                                                    return <p key={fKey}>{e != null ? e : ""} <br /></p>
                                                })}
                                            </Tooltip>
                                        </div>
                                    }
                                </td>
                                <td class="text-left">{data.status}</td>
                                <td class="text-left">
                                    {
                                        (typeof loggedUser.data != 'undefined' && loggedUser.data.userType != 'External') && <div>
                                            <a href="javascript:void(0);" data-tip="EDIT"
                                                onClick={(e) => {
                                                    dispatch({ type: "SET_TASK_FORM_ACTION", FormAction: "Edit" })
                                                    socket.emit("GET_TASK_DETAIL", { id: data.id })
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
                                                    && (data.allowToComplete == true)
                                                ) && <a href="javascript:void(0);" data-tip="COMPLETE"
                                                    onClick={e => this.updateActiveStatus({ id: data.id, periodTask: data.periodTask })}
                                                    class="btn btn-success btn-sm ml10">
                                                    <span class="glyphicon glyphicon-check"></span></a>
                                            }
                                            <Tooltip />
                                        </div>
                                    }
                                    {
                                        (typeof loggedUser.data != 'undefined' && loggedUser.data.userType == 'External') && <div>
                                            <a href="javascript:void(0);" data-tip="VIEW"
                                                onClick={(e) => {
                                                    dispatch({ type : "SET_TASK_FORM_ACTION" , FormAction : "View" })
                                                    socket.emit("GET_TASK_DETAIL", { id: data.id })
                                                }}
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