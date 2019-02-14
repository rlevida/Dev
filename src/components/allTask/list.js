import React from "react";
import _ from "lodash";
import moment from 'moment';

import { Loading } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";
import TaskStatus from "./taskStatus"
import TaskFilter from "./taskFilter"

import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props);

        this.renderStatus = this.renderStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { task } = this.props;
        const { Count } = task;

        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }
    }

    fetchData(page) {
        const { loggedUser, dispatch } = this.props;
        let fetchUrl = `/api/task?projectId=${project}&page=${page}&userId=${loggedUser.data.id}&status=${JSON.stringify({ opt: "not", value: 'Completed' })}`;

        getData(fetchUrl, {}, (c) => {
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
            <div class="pd20">
                <div class="row mb10">
                    <div class="col-lg-7 pd0">
                        <TaskFilter />
                    </div>
                </div>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th></th>
                            <th class="text-left">Project</th>
                            <th class="text-left">Workstream</th>
                            <th class="text-left">Task Name</th>
                            <th class="text-center">Due Date</th>
                            <th class="text-center">Assigned</th>
                            <th class="text-center">Followed By</th>
                            <th class="text-left">Status</th>
                        </tr>
                        {
                            taskList.map((data, index) => {
                                const assignedUser = (_.filter(data.task_members, (o) => { return o.memberType == "assignedTo" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "assignedTo" })[0].user : "";
                                const followers = (_.filter(data.task_members, (o) => { return o.memberType == "Follower" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "Follower" }) : "";
                                return (
                                    <tr key={index}>
                                        <td>
                                            {
                                                (data.dueDate != '' && data.dueDate != null) && this.renderStatus(data)
                                            }
                                        </td>
                                        <td class="text-left">{data.workstream.project.project}</td>
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