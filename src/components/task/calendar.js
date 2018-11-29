import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";

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

        this.renderStatus = this.renderStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.eventStyleGetter = this.eventStyleGetter.bind(this)
        this.handleNavigate = this.handleNavigate.bind(this)
    }

    componentDidMount() {
        const { dispatch } = this.props;

        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        this.fetchData();
    }

    fetchData() {
        const { loggedUser, dispatch, task } = this.props;
        const { taskStatus, dueDate, taskAssigned } = task.Filter;
        const selectedMonth = moment().startOf('month');
        const fromDate = moment(selectedMonth).subtract(1, 'week').format("YYYY-MM-DD");
        const toDate = moment(selectedMonth).add(1, 'week').endOf('month').format("YYYY-MM-DD");
        let requestUrl = `/api/task?projectId=${project}&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;

        if (taskStatus != "") {
            requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
        }

        if (dueDate != "") {
            requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
        }

        if (taskAssigned != "" && taskAssigned.length > 0) {
            taskAssigned.map((assignedObj) => {
                requestUrl += `&userId=${assignedObj.value}`
            });
        } else if (loggedUser.data.user_role[0].roleId >= 3) {
            requestUrl += `&userId=${loggedUser.data.id}`
        }

        getData(requestUrl, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            showToast("success", "Task successfully retrieved.");
        });
    }

    renderStatus(data) {
        const { dueDate } = { ...data };
        const dueDateMoment = moment(dueDate);
        const currentDateMoment = moment(new Date());
        let taskStatus = 0;
        let statusColor = "#000";

        if (dueDateMoment.isBefore(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 2
        } else if (dueDateMoment.isSame(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 1
        }

        if (taskStatus == 0) {
            statusColor = "#27ae60"
        } else if (taskStatus == 1) {
            statusColor = "#f39c12"
        } else if (taskStatus == 2) {
            statusColor = "#c0392b"
        }

        return statusColor;
    }

    eventStyleGetter(event) {
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

    handleNavigate(e) {
        const { dispatch } = this.props;
        const selectedMonth = moment(e).startOf('month');
        const fromDate = moment(selectedMonth).subtract(1, 'week').format("YYYY-MM-DD");
        const toDate = moment(selectedMonth).add(1, 'week').endOf('month').format("YYYY-MM-DD");
        dispatch({ type: "SET_TASK_FILTER", filter: { selected_month: [fromDate, toDate] } });
    }

    render() {
        const { task } = this.props;
        const taskList = task.List;
        return (
            <div class="pd0">
                {
                    (task.Loading != "RETRIEVING") && <BigCalendar
                        events={taskList.map((e) => {
                            e.title = e.task;
                            e.start = (typeof e.dueDate != "undefined") ? new Date(e.dueDate) : new Date()
                            e.end = (typeof e.dueDate != "undefined") ? moment(e.dueDate).add(1, 'days') : new Date()
                            e.allday = true
                            return e;
                        })}
                        defaultView='month'
                        views={['month', 'week']}
                        scrollToTime={new Date(1970, 1, 1, 6)}
                        defaultDate={new Date()}
                        onSelectEvent={event => { location.href = `/project/${event.projectId}/workstream/${event.workstreamId}?task=${event.id}` }}
                        onSelectSlot={(slotInfo) => { }}
                        eventPropGetter={(this.eventStyleGetter)}
                        onNavigate={this.handleNavigate}
                    />
                }
                {
                    (task.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}