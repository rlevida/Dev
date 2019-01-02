import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import { HeaderButtonContainer, Loading } from "../../globalComponents";
import { getData, putData, postData, deleteData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props);

        this.deleteData = this.deleteData.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
        this.renderStatus = this.renderStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.starredTask = this.starredTask.bind(this);
    }

    componentDidMount() {
        const { dispatch } = this.props;

        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        this.fetchData(1);

        getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
        });

        getData(`/api/globalORM/selectList?projectId=${project}&selectName=workstreamList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' });
        });
    }

    fetchData(page) {
        const { dispatch, task, loggedUser } = this.props;

        let requestUrl = `/api/task?projectId=${project}&page=${page}&starredUser=${loggedUser.data.id}`;
        const { taskStatus, dueDate, taskAssigned } = task.Filter;

        if (taskStatus != "") {
            if (taskStatus === 'Active') {
                requestUrl += `&status=${JSON.stringify({ opt: "not", value: 'Completed' })}`

            } else {
                requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
            }
        }

        if (dueDate != "") {
            requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
        }

        if (taskAssigned != "" && taskAssigned.length > 0) {
            taskAssigned.map((assignedObj) => {
                requestUrl += `&userId=${assignedObj.value}`
            });
        } else if (loggedUser.data.user_role[0].roleId > 3) {
            requestUrl += `&userId=${loggedUser.data.id}`
        }

        getData(requestUrl, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            showToast("success", "Task successfully retrieved.");
        });
    }

    starredTask({ id, isStarred }) {
        const { task, loggedUser, dispatch } = this.props;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred/`, {
            linkType: "task",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedTaskList = _.map([...task.List], (taskObj, index) => {
                    if (id == taskObj.id) {
                        taskObj["isStarred"] = isStarredValue;
                    }
                    return taskObj;
                });
                dispatch({ type: "SET_TASK_LIST", list: updatedTaskList });
                showToast("success", `Task successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    getNextResult() {
        const { task } = { ...this.props };
        const { Count } = task
        this.fetchData(Count.current_page + 1);
    }

    updateStatus({ id, periodTask, periodic }) {
        let { dispatch, loggedUser } = this.props;

        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: "Completed" }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                showToast("success", "Task successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
        });
    }

    deleteData(id) {
        let { dispatch } = this.props;

        if (confirm("Do you really want to delete this record?")) {
            deleteData(`/api/task/${id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "DELETE_TASK", id });
                    showToast("success", "Task successfully deleted.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }
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
        const { task, dispatch, loggedUser } = this.props;
        const currentPage = (typeof task.Count.current_page != "undefined") ? task.Count.current_page : 1;
        const lastPage = (typeof task.Count.last_page != "undefined") ? task.Count.last_page : 1;
        const taskList = task.List;

        return (
            <div class="pd0">
                <HeaderButtonContainer withMargin={true}>
                    {
                        (typeof loggedUser.data != 'undefined' && loggedUser.data.userType != 'External' && loggedUser.data.userRole < 4) &&
                        <li class="btn btn-info" onClick={(e) => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
                            dispatch({ type: "SET_TASK_SELECTED", Selected: { isActive: true } });
                            dispatch({ type: "SET_TASK_ID", SelectedId: [] })
                        }}
                        >
                            <span>New Task</span>
                        </li>
                    }
                </HeaderButtonContainer>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th></th>
                            <th></th>
                            <th class="text-left">Project</th>
                            <th class="text-left">Workstream</th>
                            <th class="text-left">Task Name</th>
                            <th class="text-center">Due Date</th>
                            <th class="text-center">Assigned</th>
                            <th class="text-center">Followed By</th>
                            <th class="text-left">Status</th>
                            <th class="text-center"></th>
                        </tr>
                        {
                            taskList.map((data, index) => {
                                const assignedUser = (_.filter(data.task_members, (o) => { return o.memberType == "assignedTo" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "assignedTo" })[0].user : "";
                                const followers = (_.filter(data.task_members, (o) => { return o.memberType == "Follower" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "Follower" }) : "";
                                return (
                                    <tr key={index}>
                                        <td>
                                            <a onClick={() => this.starredTask({ isStarred: data.isStarred, id: data.id })}>
                                                <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                                            </a>
                                        </td>
                                        <td>
                                            {
                                                (data.dueDate != '' && data.dueDate != null) && this.renderStatus(data)
                                            }
                                        </td>
                                        <td class="text-left"> {data.workstream.project.project}</td>
                                        <td class="text-left">{data.workstream.workstream}</td>
                                        <td class="text-left"><a href={`/project/${data.projectId}/workstream/${data.workstreamId}?task=${data.id}`}>{data.task}</a></td>
                                        <td class="text-center">
                                            {
                                                (data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''
                                            }
                                        </td>
                                        <td class="text-center">
                                            {
                                                (assignedUser != "" && assignedUser != null) && <span title={`${assignedUser.firstName} ${assignedUser.lastName}`}><i class="fa fa-user fa-lg"></i></span>
                                            }
                                        </td>
                                        <td class="text-center">
                                            {(followers != "") &&
                                                <div>
                                                    <span title={`${_.map(followers, (o) => { return o.user.firstName + " " + o.user.lastName }).join("\r\n")}`}><i class="fa fa-users fa-lg"></i></span>
                                                </div>
                                            }
                                        </td>
                                        <td class="text-left">{data.status}</td>
                                        <td class="text-left">
                                            {
                                                (typeof loggedUser.data != 'undefined' && loggedUser.data.userType != 'External' && loggedUser.data.userRole < 4) && <div>
                                                    <a href="javascript:void(0);" data-tip="EDIT"
                                                        onClick={(e) => {
                                                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })
                                                            dispatch({ type: "SET_TASK_ID", SelectedId: [data.id] })
                                                        }}
                                                        class="btn btn-info btn-sm">
                                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                                    <a href="javascript:void(0);" data-tip="DELETE"
                                                        onClick={e => this.deleteData(data.id)}
                                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                        <span class="glyphicon glyphicon-trash"></span></a>
                                                    {
                                                        (
                                                            (data.status == null || data.status == "In Progress" || data.status == "") && (typeof data.isActive == 'undefined' || data.isActive == 1)
                                                        ) && <a href="javascript:void(0);" data-tip="COMPLETE"
                                                            onClick={e => this.updateStatus({ id: data.id, periodTask: data.periodTask, periodic: data.periodic })}
                                                            class="btn btn-success btn-sm ml10">
                                                            <span class="glyphicon glyphicon-check"></span></a>
                                                    }
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
                <div class="text-center">
                    {
                        (currentPage != lastPage && task.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Task</a>
                    }
                    {
                        (taskList.length == 0 && task.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}