import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { DropDown } from "../../globalComponents";
import { showToast, postData, getData } from '../../globalFunction';

let keyTimer = "";

@connect((store) => {
    return {
        task: store.task,
        tasktimeLog: store.tasktimeLog,
        loggedUser: store.loggedUser
    }
})

export default class TaskTimeLog extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "handleSubmit",
            "handleChange",
            "setDropDown"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    handleChange(e) {
        const { dispatch, tasktimeLog } = { ...this.props };
        const Selected = tasktimeLog.Selected;
        dispatch({ type: "SET_TASKTIMELOG_SELECTED", Selected: { ...Selected, [e.target.name]: e.target.value } });
    }

    handleSubmit() {
        const { dispatch, tasktimeLog, task, loggedUser } = { ...this.props };
        const { Selected, TotalHours } = tasktimeLog;
        const toBeSubmitted = {
            time: Selected.total_hours,
            description: Selected.description,
            period: Selected.type,
            taskId: task.Selected.id,
            usersId: loggedUser.data.id
        };
        let currentTotalTime = TotalHours;
        dispatch({ type: "SET_TASKTIMELOG_LOADING", Loading: "SUBMITTING" });
        postData(`/api/taskTimeLogs`, toBeSubmitted, (c) => {
            $(`#task-time`).modal('hide');
            showToast("success", "Timelog successfully added.");
            dispatch({ type: "SET_TASKTIMELOG_LOADING", Loading: "" });
            dispatch({
                type: "SET_TASKTIMELOG_SELECTED", Selected: {
                    total_hours: 0,
                    description: "",
                    type: 'hours'
                }
            });
            currentTotalTime.push({ period: Selected.type, value: Selected.total_hours });
            dispatch({ type: "ADD_TASKTIMELOG_LIST", list: [c.data] });
            dispatch({ type: "SET_TOTAL_HOURS", total: currentTotalTime });
        });
    }

    setDropDown(name, value) {
        const { dispatch, tasktimeLog } = { ...this.props };
        const { Selected } = tasktimeLog;
        dispatch({ type: "SET_TASKTIMELOG_SELECTED", Selected: { ...Selected, [name]: value } });
    }

    render() {
        const { tasktimeLog } = { ...this.props };
        const typeList = [
            { id: 'hours', name: 'Hours' },
            { id: 'minutes', name: 'Minutes' }
        ];
        return (
            <form id="task-time-form">
                <div class="row">
                    <div class="col-lg-6">
                        <div class="form-group">
                            <label>Time: <span class="text-red">*</span></label>
                            <input type="number" name="total_hours" required value={tasktimeLog.Selected.total_hours} class="form-control" placeholder="Enter number of hours" onChange={this.handleChange} />
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="form-group">
                            <label>Period: <span class="text-red">*</span></label>
                            <DropDown
                                multiple={false}
                                required={true}
                                options={typeList}
                                selected={tasktimeLog.Selected.type}
                                onChange={(e) => this.setDropDown("type", e.value)}
                                placeholder={"Select log type"}
                            />
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="email">Description:</label>
                    <textarea name="description"
                        value={(typeof tasktimeLog.Selected.description == "undefined" || tasktimeLog.Selected.description == null) ? "" : tasktimeLog.Selected.description}
                        class="form-control"
                        placeholder="Add description..."
                        onChange={this.handleChange}
                    />
                </div>
                {
                    (tasktimeLog.Selected.total_hours != '0' && tasktimeLog.Selected.total_hours != "") && <a class="btn btn-violet" onClick={this.handleSubmit} disabled={(tasktimeLog.Loading == "SUBMITTING")}>
                        <span>
                            {
                                (tasktimeLog.Loading == "SUBMITTING") ? "Saving..." : "Save"
                            }
                        </span>
                    </a>
                }
            </form>
        )
    }
}