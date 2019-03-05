import React from "react";
import _ from "lodash";

import { getData } from '../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        projectData: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        const projectId = this.props.match.params.number;
        const fetchUrl = `/api/task/projectTaskStatus?projectId=${projectId}&date=${moment(new Date()).format("YYYY-MM-DD")}`;
        
        dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: {} });
        getData(fetchUrl, {}, ({ status, data }) => {
            if (status == 200) {
                dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: data });
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
            </div>
        );
    }
}