import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
import _ from "lodash";

import { getData } from "../../globalFunction";
import ProjectInfo from "./projectInfo";
import ProjectDashboard from "./projectDashboard";
import Workstream from "../workstream";
import ProjectTaskCalendar from "./projectTaskCalendar";
import Files from "../document";
import Conversations from "../conversations";

@connect(store => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    };
})
export default class ProjectDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map(["fetchProjectDetails"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidUpdate(prevProps) {
        if (prevProps.match.params.projectId != this.props.match.params.projectId) {
            this.fetchProjectDetails();
        }
    }
    componentDidMount() {
        this.fetchProjectDetails();
    }
    fetchProjectDetails() {
        const { match, dispatch } = { ...this.props };
        const projectId = match.params.projectId;

        getData(`/api/project/detail/${projectId}`, {}, c => {
            dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data });
        });
    }
    render() {
        return (
            <div>
                <Switch>
                    <Route exact={true} path={`${this.props.match.path}/info`} component={ProjectInfo} />
                    <Route exact={true} path={`${this.props.match.path}`} component={ProjectDashboard} />
                    <Route path={`${this.props.match.path}/workstreams`} component={Workstream} />
                    <Route path={`${this.props.match.path}/calendar`} component={ProjectTaskCalendar} />
                    <Route path={`${this.props.match.path}/files`} component={Files} />
                    <Route path={`${this.props.match.path}/messages`} component={Conversations} />
                </Switch>
            </div>
        );
    }
}
