import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { DropDown } from "../../globalComponents";
import { showToast, postData, getData } from '../../globalFunction';

let keyTimer = "";

@connect((store) => {
    return {
        checklist: store.checklist,
        task: store.task,
        taskDependency: store.taskDependency,
        loggedUser: store.loggedUser,
    }
})

export default class TaskDependency extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleSubmit",
            "setDropDown",
            "getTaskList",
            "setDropDownMultiple",
            "setTaskList"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleSubmit() {
        const { taskDependency, loggedUser, dispatch, task } = this.props;
        const toBeSubmitted = {
            dependencyType: taskDependency.Selected.dependency_type,
            taskId: task.Selected.id,
            task_dependencies: taskDependency.Selected.task_dependency,
            userId: loggedUser.data.id
        };
        let result = true;

        $('#task-dependency-form *').validator('validate');
        $('#task-dependency-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });


        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
            postData(`/api/taskDependency`, toBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_TASK_DEPENDENCY_LIST", List: c.data.task_dependencies });
                    dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: "" })
                    showToast("success", "Task Dependency successfully updated.");
                } else {
                    showToast("error", c.response.data.message);
                }
                $("#task-dependency-form *").validator('destroy');
            });
        }

    }

    setDropDown(name, value) {
        const { dispatch, taskDependency } = { ...this.props };
        let selected = {
            ...taskDependency.Selected,
            [name]: value
        };

        if (name == "dependencyType" && value == "") {
            selected["task_dependency"] = [];
        }

        dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: selected })
    }

    setDropDownMultiple(name, values) {
        const { taskDependency, dispatch } = this.props;
        dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: { ...taskDependency.Selected, [name]: values } });
    }

    setTaskList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.getTaskList(options);
        }, 1500);
    }

    getTaskList(options) {
        const { dispatch, task, taskDependency } = this.props;
        let fetchUrl = `/api/task?projectId=${task.Selected.projectId}&page=1`;
        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&task=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const taskOptions = _(c.data.result)
                .filter((o) => {
                    const findSelectedTaskIndex = _.findIndex(taskDependency.List, (taskDependencyObj) => { return taskDependencyObj.task.id == o.id });
                    return findSelectedTaskIndex < 0 && o.id != task.Selected.id;
                })
                .map((e) => { return { id: e.id, name: e.task } })
                .value();
            dispatch({ type: "SET_TASK_SELECT_LIST", List: _.concat(taskOptions, _.map(task.Selected.task_dependency, (o) => { return { id: o.value, name: o.label } })) });
        });
    }

    render() {
        const { taskDependency, task } = { ...this.props };

        return (
            <form class="full-form" id="task-dependency-form">
                <div class="mt10 row">
                    <div class="col-lg-8 col-sm-12">
                        <div class="form-group input-inline">
                            <label for="email">Dependency Type:<span class="text-red">*</span></label>
                            <DropDown multiple={false}
                                required={true}
                                options={_.map(['Preceded by', 'Succeeding'], (o) => { return { id: o, name: o } })}
                                selected={(typeof taskDependency.Selected.dependency_type == "undefined") ? "" : taskDependency.Selected.dependency_type}
                                onChange={(e) => {
                                    this.setDropDown("dependency_type", (e == null) ? "" : e.value);
                                }}
                                isClearable={true}
                                disabled={typeof task.Selected.workstreamId == "undefined" || task.Selected.workstreamId == ""}
                            />
                        </div>
                        <div class="form-group input-inline">
                            <label for="email">Dependent Tasks:<span class="text-red">*</span></label>
                            <DropDown multiple={true}
                                required={true}
                                options={task.SelectList}
                                onInputChange={this.setTaskList}
                                onFocus={this.setTaskList}
                                selected={(typeof taskDependency.Selected.task_dependency == "undefined") ? [] : taskDependency.Selected.task_dependency}
                                onChange={(e) => this.setDropDownMultiple("task_dependency", e)}
                                disabled={typeof task.Selected.workstreamId == "undefined" || task.Selected.workstreamId == ""}
                                placeholder={"Search or select task"}
                            />
                        </div>
                    </div>
                </div>
                <a class="btn btn-violet" onClick={this.handleSubmit}>
                    <span>Create Task Dependency</span>
                </a>
            </form>
        )
    }
}