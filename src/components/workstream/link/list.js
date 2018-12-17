import React from "react";
import moment from 'moment';
import { connect } from "react-redux";

@connect((store) => {
    return {
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        task: store.task
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
    }

    selectedLink(link) {
        let { dispatch } = this.props;
        if (link == "task") {
            dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: link })
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" })
        }
    }
    render() {
        let { workstream, dispatch, task } = this.props;

        let completeChecker = _.filter(task.List, (o) => {
            let dueDate = moment(o.dueDate);
            let currentDate = moment(new Date());
            return o.status == "Completed" || dueDate.diff(currentDate, 'days') > 0
        });

        let isDueToday = _.filter(task.List, (o) => {
            let dueDate = moment(o.dueDate);
            let currentDate = moment(new Date());
            return o.status != "Completed" && dueDate.diff(currentDate, 'days') == 0
        });

        let isLate = _.filter(task.List, (o) => {
            let dueDate = moment(o.dueDate);
            let currentDate = moment(new Date());
            return o.status != "Completed" && dueDate.diff(currentDate, 'days') < 0
        });

        let workStreamStatus = (isLate.length > 0) ? 2 : (isDueToday.length > 0) ? 1 : (completeChecker.length == (task.List).length) ? 0 : '';

        return (
            <div>
                <div>
                    <ul class="list-inline" style={{ margin: "20px" }}>
                        <li class="list-inline-item">
                            <a href="javascript:void(0)"
                                onClick={() => {
                                    this.selectedLink("task")
                                    window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
                                    dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                                    taskId = ""
                                }}>
                                List
                        </a>
                        </li>|
                    <li class="list-inline-item" style={{ color: "gray" }}>
                            <a href="javascript:void(0)"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "timeline" });
                                    window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
                                    dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                                    taskId = ""
                                }}>Timeline</a>
                        </li>|
                        <li class="list-inline-item" style={{ color: "gray" }}>
                            <a href="javascript:void(0)"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "calendar" });
                                    window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
                                    dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                                    taskId = ""
                                }}>Calendar</a>
                        </li>|
                    <li class="list-inline-item">
                            <a href="javascript:void(0)"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "member" });
                                    window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
                                    dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                                    taskId = ""
                                }}>
                                Members
                        </a>
                        </li>|
                    <li class="list-inline-item">
                            <a href="javascript:void(0)"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "document" })
                                    window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
                                    dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                                    taskId = ""
                                }}>
                                Documents</a>
                        </li>|
                    <li class="list-inline-item" style={{ color: "gray" }}>
                        <a href="javascript:void(0)"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "conversation" })
                                }}>
                        Conversation</a>
                    </li>
                    </ul>
                    <ul class="list-inline" style={{ margin: "20px" }}>
                        <li style={{ width: "40px" }}>
                            {(workstream.Selected.isActive == 1) && <span className={(workStreamStatus == 2) ? "fa fa-exclamation-circle" : "fa fa-circle"} style={{ color: (workStreamStatus == 2) ? '#c0392b' : (workStreamStatus == 1) ? '#f39c12' : (workStreamStatus == 0) ? '#27ae60' : '' }}></span>}
                            {(workstream.Selected.isActive == 0) && <span className={"fa fa-circle"}></span>}
                        </li>
                        <li style={{ width: "100px" }}>Status: {task.List.filter(e => { if (e.status == "Completed") { return e } }).length} / {task.Count.total_count}</li>
                        <li style={{ width: "100px" }}>Type:&nbsp;&nbsp; <span class={ /* Project Based or Time Based */ workstream.Selected.typeId == 4 ? "fa fa-calendar" : "glyphicon glyphicon-time"} title={workstream.Selected.typeId == 4 ? "Output based" : "Time based"}></span> </li>
                        <li style={{ width: "60px" }}>&nbsp;&nbsp;<span class="fa fa-tag" title="tag"></span></li>
                        <li style={{ width: "100x" }}>&nbsp;&nbsp;<span class="label label-success" style={{ margin: "5px" }}>{workstream.Selected.workstream}</span></li>
                    </ul>
                    {
                        (workstream.Selected.description != "") && <ul class="list-inline" style={{ margin: "20px" }}>
                            <li>{workstream.Selected.description}</li>
                        </ul>
                    }
                </div>
            </div>
        )
    }
}