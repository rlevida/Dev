import React from "react";
import _ from "lodash";
import moment from 'moment';
import BigCalendar from 'react-big-calendar';
import { connect } from "react-redux";

import { getData, showToast } from "../../globalFunction";


BigCalendar.momentLocalizer(moment);

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
            "openTaskDetails"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const currentMonth = moment().startOf('month');
        this.fetchData(currentMonth);
    }

    fetchData(selectedMonth) {
        const { dispatch } = this.props;
        const fromDate = moment(selectedMonth).subtract(1, 'week').format("YYYY-MM-DD");
        const toDate = moment(selectedMonth).add(1, 'week').endOf('month').format("YYYY-MM-DD");
        let requestUrl = `/api/task?projectId=${project}&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;
        getData(requestUrl, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
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
        const selectedMonth = moment(e).startOf('month');
        this.fetchData(selectedMonth);
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

    render() {
        const { task } = { ...this.props };
        const { List, Loading } = task;
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
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                            {
                                (Loading != "RETRIEVING") && <BigCalendar
                                    events={calendarTasks}
                                    defaultView='month'
                                    views={['month', 'week']}
                                    scrollToTime={new Date(1970, 1, 1, 6)}
                                    defaultDate={new Date()}
                                    onSelectEvent={this.openTaskDetails}
                                    onSelectSlot={(slotInfo) => { console.log("called") }}
                                    eventPropGetter={(this.eventStyleGetter)}
                                    onNavigate={this.handleNavigate}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}