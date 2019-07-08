import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Link } from "react-router-dom";

import TaskTimeline from "../task/taskTimeline";
import WorkstreamTabs from "./workstreamTabs";

import { getData, showToast } from "../../globalFunction";

@connect(store => {
    return {
        workstream: store.workstream
    };
})
export default class WorkstreamDetails extends React.Component {
    constructor(props) {
        super(props);

        this.renderStatus = this.renderStatus.bind(this);
    }
    componentDidMount() {
        const { match, dispatch } = { ...this.props };
        const workstreamId = match.params.workstreamId;
        const requestUrl = `/api/workstream?workstreamId=${workstreamId}`;

        getData(requestUrl, {}, c => {
            if (c.status == 200) {
                const selected = c.data.result.length > 0 ? c.data.result[0] : {};
                dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: selected });
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    renderStatus({ issues, dueToday }) {
        const color = issues > 0 ? "text-red" : dueToday > 0 ? "text-yellow" : "text-green";
        return <span class={`fa fa-circle mb0 mr10 ${color}`} />;
    }

    render() {
        const { match, workstream, history } = { ...this.props };
        const projectId = match.params.projectId;
        const workstreamId = match.params.workstreamId;
        const workstreamTitle = typeof workstream.Selected.workstream != "undefined" ? workstream.Selected.workstream : "";
        const workstreamDescription = typeof workstream.Selected.description != "undefined" ? workstream.Selected.description : "";
        const workstreamTasks = typeof workstream.Selected.task != "undefined" ? workstream.Selected.task : [];

        return (
            <div>
                <h3 class="title">
                    <a
                        onClick={() => {
                            history.goBack();
                        }}
                        class="mr10 text-black"
                    >
                        <i class="fa fa-chevron-left" aria-hidden="true" />
                    </a>
                    {workstreamTasks.length > 0 ? this.renderStatus(workstream.Selected) : ""}
                    {workstreamTitle}
                </h3>
                {workstreamDescription != "" && <div class="mb20">{workstreamDescription}</div>}
                <div class="mb20">
                    <TaskTimeline workstream_id={workstreamId} />
                </div>
                <div>
                    <WorkstreamTabs project_id={projectId} workstream_id={workstreamId} history={history} match={match} />
                </div>
            </div>
        );
    }
}
