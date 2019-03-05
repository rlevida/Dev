import React from "react";
import _ from "lodash";
import { connect } from "react-redux";

import { getData, showToast } from '../../globalFunction';

import Focus from '../focus';

@connect((store) => {
    return {
        projectData: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class ProjectDashboard extends React.Component {
    componentDidMount() {
        const { dispatch } = this.props;
        const projectId = this.props.match.params.projectId;

        const fetchUrl = `/api/task/projectTaskStatus?projectId=${projectId}&date=${moment(new Date()).format("YYYY-MM-DD")}`;

        dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: {} });
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } })

        getData(fetchUrl, {}, ({ status, data }) => {
            if (status == 200) {
                dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: data });
                showToast("success", "Project details successfully retrieved.");
            }
        });
    }

    renderStatusCard({ label, count, class_color }) {
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
        const {
            task_due = 0,
            task_for_approval = 0,
            new_files = 0,
            delayed_task = 0
        } = StatusCount;
        const statusToBeDisplayed = [
            { label: "Tasks Due Today", count: task_due, class_color: "text-orange" },
            { label: "Tasks For Approval", count: task_for_approval, class_color: "text-blue" },
            { label: "New Files Uploaded", count: new_files, class_color: "text-orange" },
            { label: "Delayed Tasks", count: delayed_task, class_color: "text-red" }
        ];
        const projectId = this.props.match.params.projectId;

        return (
            <div class="row content-row">
                {
                    _.map(statusToBeDisplayed, (o, index) => {
                        return (
                            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12" key={index}>
                                <div class={`card dashboard-card`}>
                                    <div class="card-body">
                                        <div class={(_.isEmpty(StatusCount)) ? "linear-background" : "margin-center"}>
                                            {
                                                (_.isEmpty(StatusCount) == false) && this.renderStatusCard(o)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 mt30">
                    <div class="card">
                        <div class="card-header"><h4>Favorites</h4></div>
                        <div class="card-body">
                            <div class="container-fluid">
                                <div class="row content-row">
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"task"} label={"Tasks"} project_id={projectId} />
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"notes"} label={"Conversations"} project_id={projectId} />
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"document"} label={"Documents"} project_id={projectId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}