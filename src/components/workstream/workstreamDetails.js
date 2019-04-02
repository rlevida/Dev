import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Link } from 'react-router-dom';

import TaskTimeline from "../task/taskTimeline";
import WorkstreamTabs from "./workstreamTabs";

import { getData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        workstream: store.workstream
    }
})
export default class WorkstreamDetails extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        const { match, dispatch } = { ...this.props };
        const workstreamId = match.params.workstreamId;
        const requestUrl = `/api/workstream?workstreamId=${workstreamId}`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                const selected = ((c.data.result).length > 0) ? c.data.result[0] : {};
                dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: selected });
                showToast("success", "Workstream successfully retrieved.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
    }

    render() {
        const { match, workstream, history } = { ...this.props };
        const projectId = match.params.projectId;
        const workstreamId = match.params.workstreamId;
        const workstreamTitle = (typeof workstream.Selected.workstream != "undefined") ? workstream.Selected.workstream : "";

        return (
            <div>
                <h3 class="title">
                    <a onClick={() => { history.goBack(); }} class="mr10 text-black">
                        <i class="fa fa-chevron-left" aria-hidden="true"></i>
                    </a>
                    {workstreamTitle}
                </h3>
                <div class="mb20">
                    <TaskTimeline workstream_id={workstreamId} />
                </div>
                <div>
                    <WorkstreamTabs
                        project_id={projectId}
                        workstream_id={workstreamId}
                    />
                </div>
            </div>
        )
    }
}