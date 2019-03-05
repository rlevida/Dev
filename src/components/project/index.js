import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import ProjectList from "./projectList";
import ProjectDashboard from "../projectDashboard";

@connect((store) => {
    return {
        project: store.project,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Switch>
                <Route exact={true} path="/projects" component={ProjectList} />
                <Route path={`${this.props.match.path}/:number`} component={ProjectDashboard} />
            </Switch>
        )
    }
}