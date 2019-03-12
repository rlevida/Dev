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
        task: store.task
    }
})
export default class Component extends React.Component {
    render() {
        const { project, task } = { ...this.props };

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
                <TaskDetails />
            </div>
        )
    }
}