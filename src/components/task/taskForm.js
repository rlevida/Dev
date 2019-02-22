import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { showToast, postData, getData, setDatePicker, displayDate } from '../../globalFunction'
import { DropDown } from "../../globalComponents"

let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        project: store.project,
        workstream: store.workstream,
        task: store.task,
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
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }
    componentDidMount() {
        this.fetchUserList();
        this.fetchProjectList();
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
    render() {
        const { dispatch, task, users, project, workstream } = { ...this.props };

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New Task
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="mb20">
                                <form id="task-form">
                                    <div class="mb20">
                                        <p class="form-header mb0">Task Details</p>
                                        <p>All with <span class="text-red">*</span> are required.</p>
                                    </div>
                                    <div class="row content-row">
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
                                                            <label for="email">
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
                                                                disabled={(typeof task.Selected.projectId == "undefined" || task.Selected.projectId == "" || workstream.Loading == "RETRIEVING")}
                                                            />
                                                            <div>
                                                                {
                                                                    (workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                                                }
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="mt10 row">
                                                    <div class="col-lg-6 col-sm-6">
                                                        <div class="form-group input-inline">
                                                            <label for="email">
                                                                Start Date:
                                                                {
                                                                    (task.Selected.periodic == 1) && <span class="text-red">*</span>
                                                                }
                                                            </label>
                                                            <input type="text"
                                                                class="form-control datepicker"
                                                                id="startDate"
                                                                name="startDate"
                                                                value={((typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null) && task.Selected.startDate != '') ? displayDate(task.Selected.startDate) : ""}
                                                                onChange={() => { }}
                                                                required={task.Selected.periodic == 1}
                                                            />

                                                        </div>
                                                    </div>
                                                    <div class="col-lg-6 col-sm-6">
                                                        <div class="form-group input-inline">
                                                            <label for="email">
                                                                Due Date:
                                                                {
                                                                    (task.Selected.periodic == 1) && <span class="text-red">*</span>
                                                                }
                                                            </label>
                                                            <input type="text"
                                                                class="form-control datepicker"
                                                                id="dueDate"
                                                                name="dueDate"
                                                                value={((typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null) && task.Selected.dueDate != '') ? displayDate(task.Selected.dueDate) : ""}
                                                                onChange={() => { }}
                                                                required={task.Selected.periodic == 1}
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
                                                            onClick={(f) => { this.handleCheckbox("isActive", (task.Selected.approvalRequired) ? 0 : 1) }}
                                                        />
                                                        Needs Approval
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}