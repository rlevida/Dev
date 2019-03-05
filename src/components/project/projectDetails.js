import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';
import ProjectDashboard from "./projectDashboard";

@connect((store) => {
    return {
        project: store.project,
    }
})
export default class ProjectDetails extends React.Component {
    render() {
        return (
            <Switch>
                <Route exact={true} path={`${this.props.match.path}`} component={ProjectDashboard} />
                <Route path={`${this.props.match.path}/workstreams`} component={ProjectDashboard} />
            </Switch>
        )
    }
}