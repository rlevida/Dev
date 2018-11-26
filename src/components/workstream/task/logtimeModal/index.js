import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, postData } from '../../../../globalFunction';
import { DropDown, HeaderButtonContainer } from "../../../../globalComponents";
// import Dropzone from 'react-dropzone';
@connect(({ task, loggedUser, tasktimeLog, global }) => {
    return {
        task,
        loggedUser,
        tasktimeLog,
        global
    }
})
export default class LogtimeModal extends React.Component {
    constructor(props) {
        super(props);
        this.setDropDown = this.setDropDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(e) {
        const { dispatch, task } = this.props;
        const selectedTask = Object.assign({}, task.Selected);
        selectedTask[e.target.name] = e.target.value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedTask });
    }

    setDropDown(name, value) {
        const { dispatch, task } = this.props;
        const selectedTask = Object.assign({}, task.Selected);
        selectedTask[name] = value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedTask });
    }

    handleSubmit() {
        const { task, loggedUser, tasktimeLog, dispatch } = { ...this.props };

        const {
            log_time: time = 1,
            log_period: period = "hours",
            log_description: description = "",
            id
        } = task.Selected;
        const submitData = {
            time,
            period,
            description,
            taskId: id,
            usersId: loggedUser.data.id
        };

        postData(`/api/taskTimeLogs`, submitData, (c) => {
            if (c.status == 200) {
                const taskTimelogList = tasktimeLog.List;
                const loggedTime = (c.data.period == "minutes") ? c.data.time / 60 : c.data.time;

                (taskTimelogList).unshift(c.data);
                dispatch({ type: "SET_TASKTIMELOG_LIST", list: taskTimelogList });
                dispatch({ type: "SET_TASK_SELECTED", Selected: _.omit(task.Selected, ["log_time", "log_period", "log_description"]) });
                dispatch({ type: "SET_TOTAL_HOURS", hours: tasktimeLog.TotalHours + loggedTime });
                
                showToast("success", "Time successfully logged.");                
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    render() {
        const { task } = { ...this.props };
        const {
            log_time = 1,
            log_period = "hours",
            log_description = ""
        } = task.Selected;


        return (
            <div class="modal fade" id="time-log" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" id="myModalLabel">Log Time</h4>
                        </div>
                        <div class="modal-body">
                            <form>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label>Log Time</label>
                                        <input
                                            type="number"
                                            name="log_time"
                                            required={true}
                                            value={log_time}
                                            class="form-control"
                                            onChange={(e) => {
                                                if (_.isNumber(_.toNumber(e.target.value)) || e.target.value == "") {
                                                    e.target.value = _.toNumber(e.target.value);
                                                    this.handleChange(e);
                                                }
                                            }}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                    <div class="col-md-6">
                                        <label>Period</label>
                                        <DropDown multiple={false}
                                            required={true}
                                            options={_.map(['hours', 'minutes'], (o) => { return { id: o, name: o } })}
                                            selected={log_period}
                                            onChange={(e) => {
                                                this.setDropDown("log_period", (e == null) ? "" : e.value);
                                            }}
                                        />
                                    </div>
                                    <div class="col-md-12">
                                        <label>Description</label>
                                        <textarea
                                            name="log_description"
                                            value={log_description}
                                            class="form-control"
                                            placeholder="Description"
                                            onChange={this.handleChange}
                                            style={{ height: 150 }}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-info" data-dismiss="modal" onClick={this.handleSubmit}>Log Time</button>
                            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}