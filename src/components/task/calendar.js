import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import TaskStatus from "./taskStatus";
import TaskFilter from "./taskFilter";
import { HeaderButtonContainer, Loading } from "../../globalComponents";
import { getData, putData, deleteData, showToast } from "../../globalFunction";

import BigCalendar from 'react-big-calendar'
BigCalendar.momentLocalizer(moment);
@connect((store) => {
    return {
        socket: store.socket.container,
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
        this.eventStyleGetter = this.eventStyleGetter.bind(this)
    }

    componentDidMount() {
        const { socket, task } = this.props;
        const { Count } = task;

        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }

        socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        socket.emit("GET_STATUS_LIST", {});
        socket.emit("GET_TYPE_LIST", {});
        socket.emit("GET_USER_LIST", {});
        socket.emit("GET_TEAM_LIST", {});
        socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "ProjectMemberList", filter: { linkId: project, linkType: "project" } });
    }

    fetchData(page) {
        const { loggedUser, dispatch, task } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.user_role, (roleObj) => { return roleObj.roleId })[0];
        let requestUrl = `/api/task?projectId=${project}&page=${page}`;
        const { taskStatus, dueDate, taskAssigned } = task.Filter;

        if (taskStatus != "") {
            requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
        }

        if (dueDate != "") {
            requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
        }

        if (taskAssigned != "") {
            requestUrl += `&userId=${taskAssigned}&role=6`
        } else {
            requestUrl += `&userId=${loggedUser.data.id}&role=${userRoles}`
        }

        getData(requestUrl, {}, (c) => {
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

        return statusColor;
    }

    eventStyleGetter(event, start, end, isSelected) {
        var backgroundColor = this.renderStatus(event);
        var style = {
            backgroundColor: backgroundColor,
            borderRadius: '0px',
            opacity: 0.8,
            color: 'black',
            border: '0px',
            display: 'block'
        };
        return {
            style: style
        };
    }

    render() {
        const { task, dispatch, loggedUser } = this.props;
        const currentPage = (typeof task.Count.current_page != "undefined") ? task.Count.current_page : 1;
        const lastPage = (typeof task.Count.last_page != "undefined") ? task.Count.last_page : 1;
        const taskList = task.List;

        return (
            <div class="pd0">
                <div class="row mb10">
                    <div class="col-lg-6" style={{ float: "right" }}>
                        <TaskStatus />
                    </div>
                </div>
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
                <div class="row mb10">
                    <div class="col-lg-6">
                        <TaskFilter />
                    </div>
                </div>
                <BigCalendar
                    selectable
                    events={taskList.map((e) => {
                        e.title = e.task;
                        e.start = (typeof e.dueDate != "undefined")?new Date(e.dueDate):new Date()
                        e.end = (typeof e.dueDate != "undefined")?moment(e.dueDate).add(1, 'days'):new Date()
                        e.allday = true
                        return e;
                    })}
                    defaultView='month'
                    views={['month', 'week']}
                    scrollToTime={new Date(1970, 1, 1, 6)}
                    defaultDate={new Date()}
                    onSelectEvent={event => { location.href = `/project/${event.projectId}/workstream/${event.workstreamId}?task=${event.id}` }}
                    onSelectSlot={(slotInfo) => {}}
                    eventPropGetter={(this.eventStyleGetter)}
                />
                {
                    (task.Loading == "RETRIEVING") && <Loading />
                }
                <div class="text-center">
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Task</a>
                    }
                    {
                        (taskList.length == 0 && task.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}