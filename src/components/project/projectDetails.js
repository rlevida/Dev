import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';
import ProjectInfo from "./projectInfo";
import ProjectDashboard from "./projectDashboard";
import Workstream from "../workstream";
import TaskCalendar from "../task/taskCalendar";

@connect((store) => {
    return {
        project: store.project,
        task: store.task
    }
})
export default class ProjectDetails extends React.Component {
    componentDidMount() {
        const { dispatch } = { ...this.props };
        const projectId = this.props.match.params.projectId;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } });
    }
    render() {
        const { task } = { ...this.props };
        
        return (
            <div>
                <Switch>
                    <Route exact={true} path={`${this.props.match.path}/info`} component={ProjectInfo} />
                    <Route exact={true} path={`${this.props.match.path}`} component={ProjectDashboard} />
                    <Route path={`${this.props.match.path}/workstreams`} component={Workstream} />
                    <Route path={`${this.props.match.path}/calendar`} component={TaskCalendar} />
                </Switch>
            </div>
        )
    }
}