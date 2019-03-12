import React from "react";
import _ from "lodash";
import moment from 'moment';
import BigCalendar from 'react-big-calendar';
import { connect } from "react-redux";

import { getData, showToast } from "../../globalFunction";


BigCalendar.momentLocalizer(moment);
let keyTimer = "";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        workstream: store.workstream
    }
})
export default class TaskCalendar extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleNavigate",
            "eventStyleGetter",
            "openTaskDetails",
            "renderCalendar"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const currentMonth = moment().startOf('month');
        this.fetchData(currentMonth);
    }

    componentDidUpdate(prevProps) {
        const { task, dispatch } = this.props;

        if (_.isEqual(prevProps.task.Filter, task.Filter) == false) {
            showToast("success", "Retrieving tasks. Please wait.");

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                const selectedMonth = (task.Filter.selected_month != "") ? task.Filter.selected_month : moment().startOf('month');
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
        const { dispatch, match = "", task, loggedUser } = this.props;
        const projectId = (match != "") ? match.params.projectId : "";
        const fromDate = moment(selectedMonth).subtract(1, 'week').format("YYYY-MM-DD");
        const toDate = moment(selectedMonth).add(1, 'week').endOf('month').format("YYYY-MM-DD");
        let fetchUrl = `/api/task?dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;

        if (projectId != "") {
            fetchUrl += `&projectId=${projectId}`
        }

        if (task.Filter.type != "") {
            fetchUrl += `&type=${task.Filter.type}&userId=${loggedUser.data.id}`
        }

        getData(fetchUrl, {}, (c) => {
            dispatch({ type: "SET_TASK_LIST", list: c.data.result });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            showToast("success", "Task successfully retrieved.");
        });
    }

    eventStyleGetter(event) {
        return {
            style: {
                backgroundColor: (typeof event.workstream.color != "undefined") ? event.workstream.color : "#7068d6",
                borderRadius: '20px',
                opacity: 0.8,
                color: 'white',
            }
        };
    }

    handleNavigate(e) {
        const { dispatch } = this.props;
        const selectedMonth = moment(e).startOf('month');

        dispatch({ type: "SET_TASK_FILTER", filter: { ["selected_month"]: selectedMonth } });
    }

    openTaskDetails(e) {
        const { dispatch, loggedUser } = this.props;
        $(`#task-details`).modal('show');
        getData(`/api/task/detail/${e.id}?starredUser=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
            } else {
                showToast("error", "Error retrieving task. Please try again later.");
            }
        });
    }

    renderCalendar() {
        const { task } = { ...this.props };
        const { List } = task;
        const calendarTasks = _(List)
            .filter((o) => {
                return o.dueDate != null && o.dueDate != "";
            })
            .map((o) => {
                return {
                    id: o.id,
                    title: o.task,
                    start: (typeof o.startDate != "undefined" && o.startDate != null) ? moment(o.startDate).toDate() : moment(o.dueDate).toDate(),
                    end: moment(o.dueDate).add(24, 'hours').toDate(),
                    allday: true,
                    workstream: o.workstream
                }
            })
            .value();

        return (
            <BigCalendar
                events={calendarTasks}
                defaultView='month'
                views={['month', 'week', 'day']}
                scrollToTime={new Date(1970, 1, 1, 6)}
                defaultDate={new Date()}
                onSelectEvent={this.openTaskDetails}
                eventPropGetter={(this.eventStyleGetter)}
                onNavigate={this.handleNavigate}
            />

        )
    }

    render() {
        const { task, is_card = true } = { ...this.props };
        const { Loading, List } = task;

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                        {
                            (is_card) ? <div class="card">
                                {
                                    (Loading != "RETRIEVING") && this.renderCalendar()
                                }
                            </div>
                                : <div>
                                    {
                                        (Loading != "RETRIEVING") && this.renderCalendar()
                                    }
                                </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}