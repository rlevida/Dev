import React from "react";
import moment from 'moment';
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import parallel from 'async/parallel';

import { Loading } from "../../../globalComponents";
import { getData } from "../../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        global: store.global
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        const { dispatch } = this.props;

        parallel({
            taskList: (parallelCallback) => {
                getData(`/api/task?projectId=${project}&workstreamId=${workstreamId}`, {}, (c) => {
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
                    if (taskId != "") {
                        let selectedTask = (c.data.result).filter((e) => { return e.id == taskId })[0]
                        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedTask })
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "View" })
                    }
                    parallelCallback(null, "")
                })
            },
            document: (parallelCallback) => {
                getData(`/api/document/`, { params: { filter: { documentFilter: { isDeleted: 0 }, documentLinkFilter: { linkId: project, linkType: "project" } } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: c.data })
                        parallelCallback(null, "")
                    } else {
                        parallelCallback(null, "")
                    }
                });
            },
            tagList: (parallelCallback) => {
                getData(`/api/global/selectList`, { params: { selectName: "tagList" } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'tagList' })
                    }
                    parallelCallback(null, "")
                })
            },
            taskCheckList: (parallelCallback) => {
                getData(`/api/checklist/getCheckList?taskId=${taskId}&includes=user`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_CHECKLIST", list: c.data })
                    }
                    parallelCallback(null, "")
                })
            },
            workstreamMemberList: (parallelCallback) => {
                getData(`/api/global/selectList`, { params: { selectName: "workstreamMemberList", filter: { id: workstreamId } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamMemberList' })
                    }
                    parallelCallback(null, "")
                })
            },
            taskCommentList: (parallelCallback) => {
                getData(`/api/conversation/getConversationList`, { params: { filter: { linkType: "task", linkId: taskId } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_COMMENT_LIST", list: c.data })
                    }
                    parallelCallback(null, "")
                })
            },
            projectMemberList: (parallelCallback) => {
                getData(`/api/global/selectList`, { params: { selectName: "ProjectMemberList", filter: { linkType: "project", linkId: project } } }, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'ProjectMemberList' })
                    parallelCallback(null, "")
                })
            },
            activities: (parallelCallback) => {
                getData(`/api/activityLog?taskId=${taskId}&page=1&includes=user`, {}, (c) => {
                    if (c.status == 200) {
                        const { data } = c;
                        dispatch({ type: "SET_ACTIVITYLOG_LIST", list: data.result, count: data.count });
                    }
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {
            dispatch({ type: "SET_TASK_LOADING", Loading: "" })
        })
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
        let { dispatch, socket } = this.props;
        parallel({
            taskCheckList: (parallelCallback) => {
                getData(`/api/checklist/getCheckList?taskId=${data.id}&includes=user`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_CHECKLIST", list: c.data })
                        dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined })
                    }
                    parallelCallback(null, "")
                })
            },
            taskCommentList: (parallelCallback) => {
                getData(`/api/conversation/getConversationList`, { params: { filter: { linkType: "task", linkId: data.id } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_COMMENT_LIST", list: c.data })
                    }
                    parallelCallback(null, "")
                })
            },
            activities: (parallelCallback) => {
                getData(`/api/activityLog?taskId=${data.id}&page=1&includes=user`, {}, (c) => {
                    if (c.status == 200) {
                        const { data } = c;
                        dispatch({ type: "SET_ACTIVITYLOG_LIST", list: data.result, count: data.count });
                    }
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {
            window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}?task=${data.id}`);
            dispatch({ type: "SET_TASK_SELECTED", Selected: data })
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "View" })
        })

        dispatch({ type: "SET_TASK_COMPONENT_CURRENT_PAGE", Page: "Workstream Task" })
        socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "workstreamMemberList", filter: { id: data.workstreamId } })
    }

    renderStatus(data) {
        const { isActive, dueDate } = { ...data };
        const dueDateMoment = moment(dueDate);
        const currentDateMoment = moment(new Date());
        let taskStatus = 0;
        let className = "";
        let statusColor = "#000";

        if (dueDateMoment.isBefore(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 2
        } else if (dueDateMoment.isSame(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 1
        }

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
        const { task } = this.props;

        return (
            <div class="pd10">
                <h3 class="m0">Tasks</h3>
                <table id="dataTable" class="table responsive-table mt30">
                    <tbody>
                        <tr>
                            <th></th>
                            <th class="text-left">Task Name</th>
                            <th class="text-center">Due Date</th>
                            <th class="text-center">Assigned</th>
                            <th class="text-center">Followed By</th>
                        </tr>
                        {
                            (task.List.length > 0 && task.Loading != "RETRIEVING") &&
                            _.orderBy(task.List, ['dueDate', 'asc']).map((data, index) => {
                                const assignedUser = (_.filter(data.task_members, (o) => { return o.memberType == "assignedTo" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "assignedTo" })[0].user : "";
                                const followers = (_.filter(data.task_members, (o) => { return o.memberType == "Follower" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "Follower" }) : "";

                                return (
                                    <tr key={index}>
                                        <td>
                                            {
                                                (data.dueDate != '' && data.dueDate != null) && this.renderStatus(data)
                                            }
                                        </td>
                                        <td class="text-left">
                                            {/* <a href={`/project/${data.projectId}/processes/${data.workstreamId}?task=${data.id}`}> */}
                                            <a href="javascript:void(0);" onClick={() => this.selectedTask(data)}>
                                                {data.task}
                                            </a>
                                        </td>
                                        <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td>
                                            {
                                                (assignedUser != "" && assignedUser != null) && <span title={`${assignedUser.firstName} ${assignedUser.lastName}`}><i class="fa fa-user fa-lg"></i></span>
                                            }
                                        </td>
                                        <td>
                                            {(followers != "") &&
                                                <div>
                                                    <span title={`${_.map(followers, (o) => { return o.user.firstName + " " + o.user.lastName }).join("\r\n")}`}><i class="fa fa-users fa-lg"></i></span>
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
                    (task.Loading == "RETRIEVING") && <Loading />
                }
                {
                    (task.List.length == 0 && task.Loading != "RETRIEVING") && <p class="text-center">No Record Found!</p>
                }
            </div>
        );
    }
}