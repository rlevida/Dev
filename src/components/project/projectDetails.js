import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';
import ProjectInfo from "./projectInfo";
import ProjectDashboard from "./projectDashboard";
import Workstream from "../workstream";
import TaskCalendar from "../task/taskCalendar";
import Files from "../document";
import Conversations from "../conversations";
import DocumentViewer from "../document/documentViewer";

@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class ProjectDetails extends React.Component {
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: "" })       
    }

    componentDidMount() {
        const { dispatch, loggedUser, history } = { ...this.props };
        const projectId = this.props.match.params.projectId;
        if (loggedUser.data.userRole >= 4) {
            const isAssignedToProject = _.filter(loggedUser.data.projectId, (e) => e === parseInt(projectId)).length
            if (isAssignedToProject) {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } });
            } else {
                history.push('/projectNotAvailable')
            }
        } else {
            dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: projectId } });
        }
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, history } = { ...this.props };
        if (prevProps.match.params.projectId !== this.props.match.params.projectId) {
            if (loggedUser.data.userRole >= 4) {
                const isAssignedToProject = _.filter(loggedUser.data.projectId, (e) => e === parseInt(this.props.match.params.projectId)).length
                if (isAssignedToProject) {
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: this.props.match.params.projectId } });
                } else {
                    history.push('/projectNotAvailable')
                }

            } else {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: { id: this.props.match.params.projectId } });
            }
        }
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