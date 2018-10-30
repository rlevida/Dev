import React from "react";
import moment from 'moment';
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import parallel from 'async/parallel';
import _ from "lodash";

import { Loading } from "../../../globalComponents";
import { getData, showToast } from "../../../globalFunction";

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

        this.deleteData = this.deleteData.bind(this);
        this.updateActiveStatus = this.updateActiveStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.getNextResult = this.getNextResult.bind(this);
    }

    componentDidMount() {
        const { task, dispatch } = this.props;
        const { Count } = task;

        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }

        if (taskId != "") {
            getData(`/api/task/detail/${taskId}`, {}, ({ data }) => {
                parallel({
                    taskCheckList: (parallelCallback) => {
                        getData(`/api/checklist/getCheckList?taskId=${data.id}&includes=user`, {}, (c) => {
                            if (c.status == 200) {
                                dispatch({ type: "SET_CHECKLIST", list: c.data });
                                dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                                parallelCallback(null, "");
                            } else {
                                parallelCallback("No record found.");
                            }
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
                    if (error == null) {
                        dispatch({ type: "SET_TASK_SELECTED", Selected: data })
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "View" })
                    } else {
                        showToast("success", result);
                    }
                });
            });
        }
    }

    fetchData(page) {
        const { loggedUser, dispatch, task } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.role, (roleObj) => { return roleObj.roleId })[0];

        getData(`/api/task?projectId=${project}&userId=${loggedUser.data.id}&page=${page}&role=${userRoles}`, {}, (c) => {
            const currentPage = (typeof task.Count.current_page != "undefined") ? task.Count.current_page : 1;

            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            showToast("success", "Task successfully retrieved.");
        });
    }

    getNextResult() {
        const { task } = { ...this.props };
        const { Count } = task
        this.fetchData(Count.current_page + 1);
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
        const { dispatch, socket } = this.props;

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
        const currentPage = (typeof task.Count.current_page != "undefined") ? task.Count.current_page : 1;
        const lastPage = (typeof task.Count.last_page != "undefined") ? task.Count.last_page : 1;
        const taskList = task.List;

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
                <div class="text-center">
                    {
                        (task.Loading == "RETRIEVING") && <Loading />
                    }
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Task</a>
                    }
                    {
                        (taskList.length == 0 && task.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        );
    }
}