import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import ProjectList from "./projectList";
import ProjectForm from "./projectForm";
import ProjectDetails from "./projectDetails";
import TaskForm from "../task/taskForm";
import TaskDetails from "../task/taskDetails";

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
        dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: "" })
    }

    componentDidMount() {
        const { loggedUser, history } = { ...this.props };
        if (loggedUser.data.userRole >= 4 && loggedUser.data.projectId.length === 1) {
            history.push(`/projects/${loggedUser.data.projectId[0]}`);
        }
    }

    render() {
        const { project, task, history } = { ...this.props };

        return (
            <div>
                {
                    (project.FormActive != "Form" && task.FormActive != "Form") && <Switch>
                        <Route exact={true} path="/projects" component={ProjectList} />
                        <Route path={`${this.props.match.path}/:projectId`} component={ProjectDetails} />
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