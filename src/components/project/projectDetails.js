import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';
import ProjectDashboard from "./projectDashboard";
import Workstream from "../workstream";

@connect((store) => {
    return {
        project: store.project,
    }
})
export default class ProjectDetails extends React.Component {
    componentDidMount() {
        const { dispatch } = { ...this.props };
        const projectId = this.props.match.params.projectId;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } });
    }
    render() {
        return (
            <Switch>
                <Route exact={true} path={`${this.props.match.path}`} component={ProjectDashboard} />
                <Route path={`${this.props.match.path}/workstreams`} component={Workstream} />
            </Switch>
        )
    }
}