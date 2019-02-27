import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { showToast, postData, putData, getData, deleteData, setDatePicker, displayDate } from '../../globalFunction';
import { DropDown, DeleteModal } from "../../globalComponents";

import TaskDependency from "./taskDependency";
import Checklist from "./checklist";

let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        project: store.project,
        workstream: store.workstream,
        checklist: store.checklist,
        task: store.task,
        taskDependency: store.taskDependency,
        users: store.users
    }
})

export default class TaskForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleChange",
            "handleDate",
            "fetchUserList",
            "setDropDown",
            "setAssignMemberList",
            "setWorkstreamList",
            "fetchProjectList",
            "fetchWorkstreamList",
            "setProjectList",
            "handleCheckbox",
            "handleSubmit",
            "getTaskDetails",
            "deleteSubTask",
            "confirmDeleteSubtask",
            "confirmDeleteTaskDependency"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }
    componentDidMount() {
        const { task } = { ...this.props };

        this.fetchUserList();
        this.fetchProjectList();

        if (typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") {
            this.fetchWorkstreamList();
            this.getTaskDetails();
        }
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "startDate", new Date(2019, 3, 20));
        setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
    }

    setAssignMemberList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchUserList(options);
        }, 1500);
    }

    setProjectList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchProjectList(options);
        }, 1500);
    }

    setWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchUserList(options) {
        const { dispatch } = { ...this.props };
        let fetchUrl = "/api/user?page=1&isDeleted=0";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const usersOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                .value();
            dispatch({ type: "SET_USER_SELECT_LIST", List: usersOptions });
        });
    }

    fetchProjectList(options) {
        const { dispatch } = { ...this.props };
        let fetchUrl = "/api/project?page=1";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&project=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const projectOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.project } })
                .value();
            dispatch({ type: "SET_PROJECT_SELECT_LIST", List: projectOptions });
        });
    }

    fetchWorkstreamList(options) {
        const { dispatch, task, loggedUser } = { ...this.props };
        const { Selected } = task;
        let fetchUrl = `/api/workstream?projectId=${Selected.projectId}&page=1&userId=${loggedUser.data.id}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&workstream=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const workstreamOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.workstream } })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    getTaskDetails() {
        const { dispatch, task } = { ...this.props };

        getData(`/api/task/detail/${task.Selected.id}`, {}, (c) => {
            dispatch({ type: "SET_CHECKLIST", list: c.data.checklist });
        });

        getData(`/api/taskDependency?includes=task&taskId=${task.Selected.id}`, {}, (c) => {
            dispatch({ type: "SET_TASK_DEPENDENCY_LIST", List: c.data })
        });
    }

    handleChange(e) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value;

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });

    }

    handleDate(e) {
        const { dispatch, task } = this.props;
        const selectedDate = (e.target.value != '') ? moment(new Date(e.target.value)).format('YYYY MMM DD') : '';
        let selectedObj = Object.assign({}, { ...task.Selected })

        if (
            (e.target.name == "startDate" && (typeof selectedObj.dueDate != "undefined" && selectedObj.dueDate != "")) ||
            (e.target.name == "dueDate" && (typeof selectedObj.startDate != "undefined" && selectedObj.startDate != ""))
        ) {
            const startDate = moment(selectedObj.startDate);
            const dueDate = moment(selectedObj.dueDate);
            const comparison = (e.target.name == "startDate") ? moment(dueDate).diff(e.target.value, 'days') : moment(e.target.value).diff(startDate, 'days');

            if (comparison < 0) {
                showToast("error", "Due date must be after the start date.");
                selectedObj[e.target.name] = undefined;
            } else {
                selectedObj[e.target.name] = selectedDate;
            }
        } else {
            selectedObj[e.target.name] = selectedDate;
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });
    }

    setDropDown(name, value) {
        let { dispatch, task } = this.props
        const selectedObj = { ...task.Selected, [name]: value };

        if (name == "dependency_type" && value == "") {
            selectedObj["task_dependency"] = [];
        }

        if (name == "projectId" && value != "") {
            selectedObj["workstreamId"] = "";
        }

        if (name == "projectId" && (typeof selectedObj.projectId != "undefined" && selectedObj.projectId != "")) {
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
            this.setWorkstreamList();
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });

    }

    handleCheckbox(name, value) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "periodic") {
            Selected = { ...Selected, dueDate: '', taskDueDate: '', periodType: '', period: (value == 1) ? 1 : 0, periodInstance: (value == 1) ? 1 : 0 }
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        const { task, dispatch, loggedUser } = this.props;
        let result = true;

        $('#task-form *').validator('validate');
        $('#task-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });


        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else if (typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1 && (typeof task.Selected.dueDate == "undefined" || task.Selected.dueDate == "")) {
            showToast("error", "Due date is required for a periodic task.");
        } else {
            const submitData = {
                ...task.Selected,
                userId: loggedUser.data.id,
                projectId: task.Selected.projectId,
                period: (typeof task.Selected.period != "undefined" && task.Selected.period != "" && task.Selected.period != null) ? _.toNumber(task.Selected.period) : 0,
                periodInstance: (typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1) ? 3 : 0,
                status: "In Progress",
                dueDate: (typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "" && task.Selected.dueDate != null) ? moment(task.Selected.dueDate).format('YYYY-MM-DD HH:mm:ss') : null
            };

            $("#task-form").validator('destroy');
            dispatch({ type: "SET_TASK_LOADING", Loading: "SUBMITTING" });

            if (typeof task.Selected.id != "undefined") {
                putData(`/api/task/${task.Selected.id}`, submitData, (c) => {
                    if (c.status == 200) {
                        showToast("success", "Task successfully updated.");
                    } else {
                        showToast("error", "Something went wrong please try again later.");
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            } else {
                postData(`/api/task`, submitData, (c) => {
                    if (c.status == 200) {
                        const {
                            id,
                            approvalRequired,
                            dueDate,
                            periodic,
                            period,
                            periodInstance,
                            periodType,
                            projectId,
                            workstream,
                            task,
                            task_members,
                            description
                        } = { ...c.data[0] };

                        dispatch({
                            type: "SET_TASK_SELECTED", Selected: {
                                id,
                                approvalRequired,
                                ...(task_members.length > 0) ? { assignedTo: task_members[0].userTypeLinkId } : {},
                                dueDate: moment(dueDate).format("YYYY MMM DD"),
                                description,
                                periodic,
                                period,
                                periodInstance,
                                periodType,
                                projectId,
                                task,
                                workstreamId: workstream.id
                            }
                        });
                        this.getTaskDetails();
                        showToast("success", "Task successfully added.");
                    } else {
                        showToast("error", "Something went wrong please try again later.");
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            }
        }
    }

    deleteSubTask(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...value, action: 'delete' } });
        $('#delete-checklist').modal("show");
    }

    deleteTaskDependency(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: { ...value, action: 'delete' } });
        $('#delete-taskDependency').modal("show");
    }

    confirmDeleteSubtask() {
        const { checklist, dispatch, task } = this.props;
        const { Selected } = checklist;

        deleteData(`/api/checklist/${Selected.id}?taskId=${task.Selected.id}`, {}, (c) => {
            dispatch({ type: "DELETE_CHECKLIST", data: { id: Selected.id } });
            showToast("success", "Subtask successfully deleted.");
            $('#delete-checklist').modal("hide");
        });
    }

    confirmDeleteTaskDependency() {
        const { dispatch, loggedUser, taskDependency } = this.props;

        deleteData(`/api/taskDependency/${taskDependency.Selected.id}?userId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "DELETE_TASK_DEPENDENCY", id: taskDependency.Selected.id });
            showToast("success", "Task Dependency successfully deleted.");
            $('#delete-taskDependency').modal("hide");
        });
    }

    render() {
        const { dispatch, task, users, project, workstream, checklist, taskDependency } = { ...this.props };
        const checklistTypeValue = (typeof checklist.Selected.description != "undefined" && _.isEmpty(checklist.Selected) == false) ? checklist.Selected.description : "";
        const taskDependencyValue = (typeof taskDependency.task != "undefined" && _.isEmpty(taskDependency.Selected) == false) ? taskDependency.task.task : "";

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New Task
                            </h4>
                        </div>
                        <div class="card-body">
                            <form id="task-form" class="full-form mb20">
                                <div class="mb20">
                                    <p class="form-header mb0">Task Details</p>
                                    <p>All with <span class="text-red">*</span> are required.</p>
                                </div>
                                <div class="row content-row mb20">
                                    <div class="col-lg-8 md-12 col-sm-12">
                                        <div class="form-group input-inline">
                                            <input
                                                type="text"
                                                name="task"
                                                required
                                                value={(typeof task.Selected.task == "undefined") ? "" : task.Selected.task}
                                                id="task-name"
                                                class="form-control underlined"
                                                placeholder="Write task name"
                                                onChange={this.handleChange}
                                            />
                                        </div>
                                        <div class="mt20">
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <label for="email">Assigned:</label>
                                                        <DropDown
                                                            required={false}
                                                            options={users.SelectList}
                                                            onInputChange={this.setAssignMemberList}
                                                            selected={(typeof task.Selected.assignedTo == "undefined") ? "" : task.Selected.assignedTo}
                                                            onChange={(e) => {
                                                                this.setDropDown("assignedTo", (e == null) ? "" : e.value);
                                                            }}
                                                            placeholder={'Search name'}
                                                        />
                                                    </div>
                                                </div>
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <label for="email">Project: <span class="text-red">*</span></label>
                                                        <DropDown
                                                            required={true}
                                                            options={project.SelectList}
                                                            onInputChange={this.setProjectList}
                                                            selected={(typeof task.Selected.projectId == "undefined") ? "" : task.Selected.projectId}
                                                            onChange={(e) => {
                                                                this.setDropDown("projectId", (e == null) ? "" : e.value);
                                                            }}
                                                            placeholder={'Search project'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <label>
                                                            Workstream: <span class="text-red">*</span>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={workstream.SelectList}
                                                            onInputChange={this.setWorkstreamList}
                                                            selected={(typeof task.Selected.workstreamId == "undefined") ? "" : task.Selected.workstreamId}
                                                            onChange={(e) => {
                                                                this.setDropDown("workstreamId", (e == null) ? "" : e.value);
                                                            }}
                                                            placeholder={'Search workstream project'}
                                                            disabled={(workstream.Loading == "RETRIEVING")}
                                                        />
                                                        <div class="loading">
                                                            {
                                                                (workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                                            }
                                                        </div>

                                                    </div>
                                                </div>
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <label>
                                                            Due Date:
                                                                {
                                                                (task.Selected.periodic == 1) && <span class="text-red">*</span>
                                                            }
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={task.Selected.periodic == 1}
                                                            id="dueDate"
                                                            class="form-control datepicker"
                                                            name="dueDate"
                                                            value={(typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null && task.Selected.dueDate != '') ? displayDate(task.Selected.dueDate) : ""}
                                                            placeholder="Select valid end date"
                                                            onChange={() => { }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt20 row">
                                                <div class="col-lg-12 col-sm-12">
                                                    <textarea name="description"
                                                        value={(typeof task.Selected.description == "undefined" || task.Selected.description == null) ? "" : task.Selected.description}
                                                        class="form-control underlined"
                                                        placeholder="Add description..."
                                                        onChange={this.handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 md-12 col-sm-12">
                                        <div>
                                            <div class="checkbox">
                                                <label>
                                                    <input type="checkbox"
                                                        checked={task.Selected.approvalRequired ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("approvalRequired", (task.Selected.approvalRequired) ? 0 : 1) }}
                                                    />
                                                    Needs Approval
                                                    </label>
                                            </div>
                                        </div>
                                        <div>
                                            <div class="checkbox">
                                                <label>
                                                    <input type="checkbox"
                                                        checked={task.Selected.periodic ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("periodic", (task.Selected.periodic) ? 0 : 1) }}
                                                    />
                                                    Recurring Task
                                                    </label>
                                            </div>
                                        </div>
                                        {
                                            (typeof task.Selected.periodic != "undefined" && task.Selected.periodic != "") && <div>
                                                <div class="row">
                                                    <div class="col-lg-6 md-6 col-sm-6">
                                                        <div class="form-group">
                                                            <label>
                                                                Recurring Every:<span class="text-red">*</span>
                                                            </label>
                                                            <DropDown multiple={false}
                                                                required={(task.Selected.periodic == 1)}
                                                                options={_.map(['Year', 'Month', 'Week', 'Day'], (o) => { return { id: (o + 's').toLowerCase(), name: o } })}
                                                                selected={(typeof task.Selected.periodType == "undefined") ? "" : task.Selected.periodType}
                                                                onChange={(e) => this.setDropDown("periodType", e.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                                <a class="btn btn-violet mr5" onClick={this.handleSubmit} disabled={(task.Loading == "SUBMITTING")}>
                                    <span>
                                        {
                                            (task.Loading == "SUBMITTING") ? "Creating..." :
                                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") ? "Edit Task" :
                                                    "Create Task"
                                        }
                                    </span>
                                </a>
                                <a class="btn btn-default"
                                    onClick={(e) => {
                                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <span>Cancel</span>
                                </a>
                            </form>
                            {
                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") &&
                                <div class="bt mb20">
                                    <div class="row">
                                        <div class=" col-lg-12 md-12 col-sm-12">
                                            <div class="mt20 mb20">
                                                <p class="form-header mb0">Task Subtask</p>
                                                <p>All with <span class="text-red">*</span> are required.</p>
                                            </div>
                                            <Checklist />
                                            <div class={(checklist.Loading == "RETRIEVING" && (checklist.List).length == 0) ? "linear-background mt20" : "mt20"}>
                                                {
                                                    ((checklist.List).length > 0) && <table>
                                                        <thead>
                                                            <tr>
                                                                <th scope="col">Subtask</th>
                                                                <th scope="col">Type</th>
                                                                <th scope="col">Added By</th>
                                                                <th scope="col">Date Added</th>
                                                                <th scope="col">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                _.map(checklist.List, (o, index) => {
                                                                    const { description, user, isDocument } = o;

                                                                    return (
                                                                        <tr key={index}>
                                                                            <td data-label="Subtask" class="td-left">
                                                                                {description}
                                                                            </td>
                                                                            <td data-label="Type">
                                                                                {
                                                                                    (isDocument == 1) && <p class="mb0">Document</p>
                                                                                }
                                                                            </td>
                                                                            <td data-label="Added By">
                                                                                {
                                                                                    user.firstName + " " + user.lastName
                                                                                }
                                                                            </td>
                                                                            <td data-label="Date Added">
                                                                                {
                                                                                    moment(o.dateAdded).format("MMMM DD, YYYY")
                                                                                }
                                                                            </td>
                                                                            <td data-label="Action">
                                                                                <a
                                                                                    href="javascript:void(0);"
                                                                                    onClick={(e) => this.deleteSubTask(o)}
                                                                                    class="btn btn-action"
                                                                                >
                                                                                    <span class="fa fa-trash"></span></a>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                }
                                                {
                                                    ((checklist.List).length == 0 && checklist.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") &&
                                <div class="bt mb20">
                                    <div class="row">
                                        <div class=" col-lg-12 md-12 col-sm-12">
                                            <div class="mt20 mb20">
                                                <p class="form-header mb0">Task Dependencies</p>
                                                <p>All with <span class="text-red">*</span> are required.</p>
                                            </div>
                                            <TaskDependency />
                                            <div class={(taskDependency.Loading == "RETRIEVING" && (taskDependency.List).length == 0) ? "linear-background mt20" : "mt20"}>
                                                {
                                                    ((taskDependency.List).length > 0) && <table>
                                                        <thead>
                                                            <tr>
                                                                <th scope="col" class="td-left">Task</th>
                                                                <th scope="col">Dependency Type</th>
                                                                <th scope="col">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                _.map(taskDependency.List, (o, index) => {
                                                                    const { task, dependencyType } = o;

                                                                    return (
                                                                        <tr key={index}>
                                                                            <td data-label="Task" class="td-left">
                                                                                {task.task}
                                                                            </td>
                                                                            <td data-label="Dependency Type">
                                                                                {dependencyType}
                                                                            </td>
                                                                            <td data-label="Action">
                                                                                <a
                                                                                    href="javascript:void(0);"
                                                                                    onClick={(e) => this.deleteTaskDependency(o)}
                                                                                    class="btn btn-action"
                                                                                >
                                                                                    <span class="fa fa-trash"></span></a>
                                                                            </td>
                                                                        </tr>
                                                                    )
                                                                })
                                                            }
                                                        </tbody>
                                                    </table>
                                                }
                                                {
                                                    ((taskDependency.List).length == 0 && taskDependency.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                {/* Modals */}
                <DeleteModal
                    id="delete-checklist"
                    type={'checklist'}
                    type_value={checklistTypeValue}
                    delete_function={this.confirmDeleteSubtask}
                />
                <DeleteModal
                    id="delete-taskDependency"
                    type={'task dependency'}
                    type_value={taskDependencyValue}
                    delete_function={this.confirmDeleteTaskDependency}
                />
            </div>
        )
    }
}