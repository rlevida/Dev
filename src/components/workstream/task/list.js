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
        let { dispatch } = this.props;
        let listToGet = { params: { filter: { projectId: project, workstreamId: workstreamId } } }

        parallel({
            taskList: (parallelCallback) => {
                getData(`/api/task/getTaskList`, listToGet, (c) => {
                    dispatch({ type: "SET_TASK_LIST", list: c.data })
                    if (taskId != "") {
                        let selectedTask = c.data.filter((e) => { return e.id == taskId })[0]
                        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedTask })
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "View" })
                    }
                    parallelCallback(null, "")
                })
            },
            document: (parallelCallback) => {
                getData(`/api/document/getByProject`, { params: { filter: { isDeleted: 0, linkId: project, linkType: "project" } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: c.data })
                    }
                    parallelCallback(null, "")
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
                getData(`/api/checklist/getCheckList`, { params: { filter: { taskId: taskId } } }, (c) => {
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
                getData(`/api/checklist/getCheckList`, { params: { filter: { taskId: data.id } } }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_CHECKLIST", list: c.data })
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
            // console.log(`end loading`)
        })

        // dispatch({ type: "SET_TASK_COMPONENT_CURRENT_PAGE" , Page: "Workstream Task"})
        // socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "workstreamMemberList" , filter: { id: data.workstreamId  } })
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
                                    <tr key={index}>
                                        <td>{this.renderStatus({ ...data, taskStatus })}</td>
                                        <td class="text-left">
                                            {/* <a href={`/project/${data.projectId}/processes/${data.workstreamId}?task=${data.id}`}> */}
                                            <a href="javascript:void(0);" onClick={() => this.selectedTask(data)}>
                                                {data.task}
                                            </a>
                                        </td>
                                        <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td>{(data.assignedById) ? <span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span> : ""}</td>
                                        <td>
                                            {(data.followersName != null) &&
                                                <div>
                                                    <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                                    <Tooltip id={`follower${index}`}>
                                                        {data.followersName.split(",").map((e, index) => {
                                                            return <p key={index}>{e != null ? e : ""} <br /></p>
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