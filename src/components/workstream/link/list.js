import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment';
import {
    map,
    filter
} from "lodash";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        projectData: store.project,
        loggedUser: store.loggedUser,
        task: store.task
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
    }
    componentWillMount() {
        let taskListInterval = setInterval(() => {
            if (this.props.workstream.Selected.id) {
                this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: this.props.workstream.Selected.id } });
                clearInterval(taskListInterval)
            }
        }, 1000)
    }
    selectedLink(link) {
        let { dispatch } = this.props;
        if (link == "task") {
            dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: link })
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" })
        }
    }
    render() {
        let { workstream, projectData, dispatch, task } = this.props;

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
                        <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => this.selectedLink("task")}>List</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{ color: "gray" }}>Calendar&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{ color: "gray" }}>Timeline&nbsp;&nbsp;</li>|
                    <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "member" })}>Members</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item"><a href="javascript:void(0)" onClick={() => dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "document" })}>Documents</a>&nbsp;&nbsp;</li>|
                    <li class="list-inline-item" style={{ color: "gray" }}>Conversation</li>
                    </ul>
                    <ul class="list-inline" style={{ margin: "20px" }}>
                        <li style={{ width: "40px" }}>
                            {(workstream.Selected.isActive == 1) && <span className={(workStreamStatus == 2) ? "fa fa-exclamation-circle" : "fa fa-circle"} style={{ color: (workStreamStatus == 2) ? '#c0392b' : (workStreamStatus == 1) ? '#f39c12' : (workStreamStatus == 0) ? '#27ae60' : '' }}></span>}
                            {(workstream.Selected.isActive == 0) && <span className={"fa fa-circle"}></span>}
                        </li>
                        <li style={{ width: "100px" }}>Status: {task.List.filter(e => { if (e.status == "Completed") { return e } }).length} / {task.List.length}</li>
                        <li style={{ width: "100px" }}>Type:&nbsp;&nbsp; <span class={ /* Project Based or Time Based */ workstream.Selected.typeId == 4 ? "fa fa-calendar" : "glyphicon glyphicon-time"} title={workstream.Selected.typeId == 4 ? "Output based" : "Time based"}></span> </li>
                        <li style={{ width: "60px" }}>&nbsp;&nbsp;<span class="fa fa-tag" title="tag"></span></li>
                        <li style={{ width: "100x" }}>&nbsp;&nbsp;<span class="label label-success" style={{ margin: "5px" }}>{workstream.Selected.workstream}</span></li>
                    </ul>
                    {
                        (workstream.Selected.projectDescription != "") && <ul class="list-inline" style={{ margin: "20px" }}>
                            <li>{workstream.Selected.projectDescription}</li>
                        </ul>
                    }
                </div>
            </div>
        )
    }
}