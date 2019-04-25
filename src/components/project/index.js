import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import ProjectList from "./projectList";
import ProjectForm from "./projectForm";
import ProjectDetails from "./projectDetails";
import TaskForm from "../task/taskForm";
import TaskDetails from "../task/taskDetails";
import NotAvailable from "../notAvailable";

@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: {} });
        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: "" });
        this.unlisten();
    }

    componentWillMount() {
        const { dispatch } = { ...this.props };
        this.unlisten = this.props.history.listen(() => {
            dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
            const currentProjectPage = (this.props.history.location.pathname).split("/")
           
            if(typeof currentProjectPage[3] != "undefined" && currentProjectPage[3] != "workstreams"){
               dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
           }
        });
    }

    render() {
        const { project, task, history, loggedUser } = { ...this.props };
        const projectId = (history.location.pathname).split('/')[2];
        const isProjectMember = _.filter(loggedUser.data.projectId, (e) => e === parseInt(projectId)).length;
        return (
            <div>
                {
                    (project.FormActive != "Form" && task.FormActive != "Form") && <Switch>
                        <Route exact={true} path="/projects" component={
                            (
                                (loggedUser.data.userRole <= 4) ||
                                (loggedUser.data.userRole < 4 && isProjectMember > 0) ||
                                (loggedUser.data.userRole > 4 && loggedUser.data.projectId.length > 1)
                            ) ? ProjectList : NotAvailable
                        } />
                        <Route path={`${this.props.match.path}/:projectId`} component={(isProjectMember > 0 || loggedUser.data.userRole < 3) ? ProjectDetails : NotAvailable} />
                    </Switch>
                }
                {
                    (task.FormActive == "Form") && <TaskForm />
                }
                {
                    (project.FormActive == "Form") && <ProjectForm />
                }
                <TaskDetails history={history} />
            </div>
        )
    }
}