import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import ProjectList from "./projectList";
import ProjectDetails from "./projectDetails";

@connect((store) => {
    return {
        project: store.project,
    }
})
export default class Component extends React.Component {
    render() {
        return (
            <Switch>
                <Route exact={true} path="/projects" component={ProjectList} />
                <Route path={`${this.props.match.path}/:projectId`} component={ProjectDetails} />
            </Switch>
        )
    }
}