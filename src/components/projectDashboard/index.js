import React from "react";
import _ from "lodash";

import Header from "../partial/header";
import { getData } from '../../globalFunction';
// import WorkstreamStatus from "../workstream/workstreamStatus";
// import TaskStatus from "../task/taskStatus";
// import DocumentStatus from "../document/documentStatus";
// import NotesStatus from "./noteStatus";
// import Task from "./task";

import { connect } from "react-redux"
@connect((store) => {
    return {
        projectData: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);


    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        const fetchUrl = `/api/task/myTaskStatus?projectId=${project}&date=${moment(new Date()).format("YYYY-MM-DD")}&userId=${loggedUser.data.id}`;
        getData(fetchUrl, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    renderStatusCard({ label, count, class_color }) {
        const { task } = this.props;
        const { StatusCount } = task;

        return (
            <div class="flex-row">
                <div class="flex-col">
                    <p class={`status-count ${class_color}`}>{('0' + count).slice(-2)}</p>
                </div>
                <div class="flex-col">
                    <p class="status-label">{label}</p>
                </div>
            </div>
        );
    }

    render() {
        const { task } = this.props;
        const { StatusCount } = task;
        const statusToBeDisplayed = [
            { label: "Assigned Tasks", count: (StatusCount.assigned_active != "undefined") ? StatusCount.assigned_active : 0 , class_color: "text-orange"},
            { label: "Followed Tasks", count: (StatusCount.followed_active != "undefined") ? StatusCount.followed_active : 0, class_color: "text-blue" },
            { label: "Delayed Tasks", count: (StatusCount.assigned_issues != "undefined") ? StatusCount.assigned_issues : 0, class_color: "text-red" }
        ];
        console.log(StatusCount)
        const Component = <div class="row content-row">
            {
                _.map(statusToBeDisplayed, (o, index) => {
                    return (
                        <div class="col-lg-4 col-md-4 col-sm-4 col-xs-12" key={index}>
                            <div class="card dashboard-card">
                                <div class={(_.isEmpty(StatusCount)) ? "linear-background" : "margin-center"}>
                                    {
                                        (_.isEmpty(StatusCount) == false) && this.renderStatusCard(o)
                                    }
                                </div>
                            </div>
                        </div>
                    )
                })
            }
        </div>
        return (
            <Header component={Component} page={"Project Dashboard"} />
        );
    }
}