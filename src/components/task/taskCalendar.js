import React from "react";
import _ from "lodash";
import moment from "moment";
import BigCalendar from "react-big-calendar";
import { connect } from "react-redux";

import { getData, showToast } from "../../globalFunction";

BigCalendar.momentLocalizer(moment);
let keyTimer = "";

@connect(store => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings
    };
})
export default class TaskCalendar extends React.Component {
    constructor(props) {
        super(props);

        _.map(["handleNavigate", "eventStyleGetter", "openTaskDetails", "renderCalendar"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const currentMonth = moment().startOf("month");
        showToast("success", "Retrieving tasks. Please wait.");
        this.fetchData(currentMonth);
    }

    componentDidUpdate(prevProps) {
        const { task } = this.props;

        if (_.isEqual(prevProps.task.Filter, task.Filter) == false) {
            showToast("success", "Retrieving tasks. Please wait.");

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                const selectedMonth = task.Filter.selected_month != "" ? task.Filter.selected_month : moment().startOf("month");
                this.fetchData(selectedMonth);
            }, 1000);
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_TASK_FILTER", filter: { ["selected_month"]: "" } });
    }

    fetchData(selectedMonth) {
        const { dispatch, projectId = "", task, loggedUser } = this.props;
        const fromDate = moment(selectedMonth)
            .subtract(1, "week")
            .format("YYYY-MM-DD");
        const toDate = moment(selectedMonth)
            .add(1, "week")
            .endOf("month")
            .format("YYYY-MM-DD");
        let fetchUrl = `/api/task?dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}&view=calendar`;
        if (projectId != "") {
            fetchUrl += `&projectId=${projectId}`;
        }
        if (task.Filter.type != "") {
            fetchUrl += `&type=${task.Filter.type}&userId=${loggedUser.data.id}`;
        }

        if (task.Filter.task != "") {
            fetchUrl += `&task=${task.Filter.task}`;
        }

        if (task.Filter.taskStatus != "") {
            if (task.Filter.taskStatus === "Active") {
                fetchUrl += `&status=${JSON.stringify({ opt: "not", value: "Completed" })}&isActive=1`;
            } else {
                fetchUrl += `&status=${JSON.stringify({ opt: "eq", value: task.Filter.taskStatus })}`;
            }
        }

        if (task.Filter.taskAssigned != "") {
            fetchUrl += `&assigned=${task.Filter.taskAssigned}`;
        }

        getData(fetchUrl, {}, c => {
            dispatch({ type: "SET_TASK_LIST", list: c.data.result });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
        });
    }

    eventStyleGetter(event) {
        return {
            style: {
                backgroundColor: typeof event.workstream.color != "undefined" ? event.workstream.color : "#7068d6",
                borderRadius: "20px",
                opacity: 0.8,
                color: "white"
            }
        };
    }

    handleNavigate(e) {
        const { dispatch } = this.props;
        const selectedMonth = moment(e).startOf("month");

        dispatch({ type: "SET_TASK_FILTER", filter: { ["selected_month"]: selectedMonth } });
    }

    openTaskDetails(e) {
        const { dispatch, loggedUser } = this.props;
        $(`#task-details`).modal("show");

        getData(`/api/task/detail/${e.id}?starredUser=${loggedUser.data.id}`, {}, c => {
            if (c.status == 200 && !c.data.error) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
            } else {
                showToast("error", c.data.message);
            }
        });

        getData(`/api/activityLog?taskId=${e.id}&page=1&includes=user`, {}, c => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_ACTIVITYLOG_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/conversation/getConversationList?page=1&linkType=task&linkId=${e.id}`, {}, c => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_COMMENT_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/taskTimeLogs?taskId=${e.id}&page=1`, {}, c => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASKTIMELOG_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_TOTAL_HOURS", total: c.data.total_hours });
            }
        });
    }

    renderCalendar() {
        const { task, settings } = { ...this.props };
        const { List } = task;
        const calendarTasks = _(List)
            .filter(o => {
                return o.dueDate != null && o.dueDate != "";
            })
            .map(o => {
                const assigned = _.find(o.task_members, o => {
                    return o.memberType == "assignedTo";
                });
                const title =
                    typeof assigned != "undefined" ? (
                        <span title="">
                            <div class="display-flex vh-center">
                                <div class="profile-div">
                                    <div class="thumbnail-profile">
                                        <img
                                            src={`${settings.site_url}api/file/profile_pictures/${assigned.user.avatar}`}
                                            alt="Profile Picture" class="img-responsive" />
                                    </div>
                                </div>
                                {o.task}
                            </div>
                        </span>
                    ) : (
                            o.task
                        );
                return {
                    id: o.id,
                    title: title,
                    start: typeof o.startDate != "undefined" && o.startDate != null ? moment(o.startDate).toDate() : moment(o.dueDate).toDate(),
                    end: moment(o.dueDate)
                        .add(1, "days")
                        .startOf("day")
                        .toDate(),
                    allday: true,
                    workstream: o.workstream
                };
            })
            .value();
        return (
            <BigCalendar
                events={calendarTasks}
                defaultView="month"
                views={["month", "week", "day"]}
                scrollToTime={new Date(1970, 1, 1, 6)}
                defaultDate={new Date()}
                onSelectEvent={this.openTaskDetails}
                eventPropGetter={this.eventStyleGetter}
                onNavigate={this.handleNavigate}
            />
        );
    }

    render() {
        const { is_card = true } = { ...this.props };

        return (
            <div class="row">
                <div class="col-lg-12">
                    {is_card ? (
                        <div class="card">
                            <div>{this.renderCalendar()}</div>
                        </div>
                    ) : (
                            <div>{this.renderCalendar()}</div>
                        )}
                </div>
            </div>
        );
    }
}
