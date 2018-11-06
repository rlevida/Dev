import React from "react";
import { connect } from "react-redux";

import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import { showToast, postData, getData } from '../../globalFunction';

let keyTimer = "";

@connect((store) => {
    return {
        checklist: store.checklist,
        task: store.task,
        taskDependency: store.taskDependency,
        socket: store.socket.container,
        loggedUser: store.loggedUser,
    }
})

export default class TaskDependency extends React.Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.setDropDown = this.setDropDown.bind(this);
        this.getTaskList = this.getTaskList.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
    }

    handleSubmit() {
        const { task, loggedUser, dispatch } = this.props;
        const toBeSubmitted = {
            dependencyType: task.Selected.dependency_type,
            taskId: task.Selected.id,
            task_dependencies: task.Selected.task_dependency,
            userId: loggedUser.data.id
        };

        postData(`/api/taskDependency`, toBeSubmitted, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_DEPENDENCY_LIST", List: c.data });
            dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, dependency_type: "", task_dependency: [] } });
            dispatch({ type: "SET_TASK_SELECT_LIST", List: [] });
            showToast("success", "Task Dependency successfully updated.");
            keyTimer && clearTimeout(keyTimer);
        });
    }

    setDropDown(name, value) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "dependencyType" && value == "") {
            Selected["task_dependency"] = [];
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        const { task, dispatch } = this.props;
        dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, [name]: values } });
    }

    getTaskList(options) {
        const { loggedUser, dispatch, task, taskDependency } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.user_role, (roleObj) => { return roleObj.roleId })[0];

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/task?projectId=${project}&userId=${loggedUser.data.id}&page=1&role=${userRoles}&task=${options}`, {}, (c) => {
                    const taskOptions = _(c.data.result)
                        .filter((o) => {
                            const findSelectedTaskIndex = _.findIndex(taskDependency.List, (taskDependencyObj) => { return taskDependencyObj.task.id == o.id });
                            return findSelectedTaskIndex < 0 && o.id != task.Selected.id;
                        })
                        .map((e) => { return { id: e.id, name: e.task } })
                        .value();
                    dispatch({ type: "SET_TASK_SELECT_LIST", List: _.concat(taskOptions, _.map(task.Selected.task_dependency, (o) => { return { id: o.value, name: o.label } })) });
                });
            }, 1500)
        }
    }



    render() {
        const { task } = { ...this.props };

        return (
            <div style={{ marginBottom: 25 }}>
                {
                    (
                        (typeof task.Selected.dependency_type != "undefined" &&
                            typeof task.Selected.task_dependency != "undefined") &&
                        (task.Selected.dependency_type != "" &&
                            task.Selected.task_dependency != "")
                    ) && <HeaderButtonContainer withMargin={true}>
                        <li class="btn btn-info" onClick={this.handleSubmit} data-toggle="modal" data-target="#taskDependencyModal">
                            <span>Save</span>
                        </li>
                    </HeaderButtonContainer>
                }
                <div class="row">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <form onSubmit={this.handleSubmit} class="form-horizontal member-form-container">
                            <div class="form-group">
                                <div class="col-md-12 col-xs-12">
                                    <label class="checkbox-inline pd0" style={{ fontWeight: "bold" }}>Dependency Type *</label>
                                    <DropDown multiple={false}
                                        required={true}
                                        options={_.map(['Preceded by', 'Succeeding'], (o) => { return { id: o, name: o } })}
                                        selected={(typeof task.Selected.dependency_type == "undefined") ? "" : task.Selected.dependency_type}
                                        onChange={(e) => {
                                            this.setDropDown("dependency_type", (e == null) ? "" : e.value);
                                        }}
                                        isClearable={true}
                                    />
                                </div>
                                <div class="col-md-12 col-xs-12 mt5">
                                    <label class="checkbox-inline pd0" style={{ fontWeight: "bold" }}>Dependent Tasks *</label>
                                    <DropDown multiple={true}
                                        required={typeof task.Selected.dependency_type != "undefined"
                                            && (task.Selected.dependency_type != "" &&
                                                task.Selected.dependency_type != null)}
                                        options={task.SelectList}
                                        onInputChange={this.getTaskList}
                                        selected={(typeof task.Selected.task_dependency == "undefined") ? [] : task.Selected.task_dependency}
                                        onChange={(e) => this.setDropDownMultiple("task_dependency", e)}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}