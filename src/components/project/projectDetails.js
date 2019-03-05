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
                <Route path={`${this.props.match.path}`} component={ProjectDashboard} />
            </Switch>
        )
    }
}