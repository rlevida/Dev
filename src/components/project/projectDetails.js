import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';
import ProjectInfo from "./projectInfo";
import ProjectDashboard from "./projectDashboard";
import Workstream from "../workstream";
import TaskCalendar from "../task/taskCalendar";
import Files from "../document";
import Conversations from "../conversations";

@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class ProjectDetails extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelectedProject = this.handleSelectedProject.bind(this);
    }
    componentDidUpdate(prevProps) {
        if (prevProps.match.params.projectId != this.props.match.params.projectId) {
            this.handleSelectedProject();
        }
    }
    componentDidMount() {
        this.handleSelectedProject();
    }
    handleSelectedProject() {
        const { dispatch } = { ...this.props };
        const projectId = this.props.match.params.projectId;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } });
    }
    render() {
        return (
            <div>
                <Switch>
                    <Route exact={true} path={`${this.props.match.path}/info`} component={ProjectInfo} />
                    <Route exact={true} path={`${this.props.match.path}`} component={ProjectDashboard} />
                    <Route path={`${this.props.match.path}/workstreams`} component={Workstream} />
                    <Route path={`${this.props.match.path}/calendar`} component={TaskCalendar} />
                    <Route path={`${this.props.match.path}/files`} component={Files} />
                    <Route path={`${this.props.match.path}/messages`} component={Conversations} />
                </Switch>
            </div>
        )
    }
}