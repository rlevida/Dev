import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { showToast, postData, putData, getData, deleteData } from "../../globalFunction";
import { DropDown, DeleteModal } from "../../globalComponents";

import TaskDependency from "./taskDependency";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

let keyTimer = "";

@connect(store => {
    return {
        checklist: store.checklist,
        loggedUser: store.loggedUser,
        members: store.members,
        project: store.project,
        task: store.task,
        taskDependency: store.taskDependency,
        users: store.users,
        workstream: store.workstream,
        settings: store.settings
    };
})
export default class TaskForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentData: {}
        };
        _.map(
            [
                "handleChange",
                "handleDate",
                "fetchAssignList",
                "setDropDown",
                "setAssignMemberList",
                "setWorkstreamList",
                "fetchProjectList",
                "fetchWorkstreamList",
                "setProjectList",
                "setApproverList",
                "handleCheckbox",
                "handleSubmit",
                "getTaskDetails",
                "fetchApproverMembers",
                "confirmDeleteTaskDependency",
                "renderArrayTd",
                "onChangeRaw"
            ],
            fn => {
                this[fn] = this[fn].bind(this);
            }
        );
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };

        dispatch({ type: "SET_WORKSTREAM_LIST", list: [], Count: {} });
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
    }
    componentDidMount() {
        const { task, project } = { ...this.props };

        this.fetchAssignList();
        this.fetchProjectList();

        $(".form-control").attr("autocomplete", "off");

        if (typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") {
            this.fetchWorkstreamList();
            this.fetchApproverMembers();
            this.getTaskDetails();
        }

        if (typeof project.Selected.id != "undefined" && project.Selected.id != "") {
            this.fetchApproverMembers();
            this.fetchWorkstreamList();
            this.fetchAssignList();
        }
    }
    setAssignMemberList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchAssignList(options);
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

    setApproverList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchApproverMembers(options);
        }, 1500);
    }

    fetchAssignList(options) {
        const { dispatch, task, project } = { ...this.props };
        const { Selected } = task;
        const projectId = Selected.projectId || project.Selected.id;

        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${projectId}&linkType=project`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, c => {
            const usersOptions = _(c.data)
                .map(o => {
                    return { id: o.id, name: o.firstName + " " + o.lastName, image: o.avatar };
                })
                .value();
            dispatch({ type: "SET_USER_SELECT_LIST", List: usersOptions });
        });
    }

    fetchProjectList(options) {
        const { dispatch, loggedUser } = { ...this.props };
        let requestUrl = `/api/v2project?userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&isActive=1&isDeleted=0`;

        if (loggedUser.data.userRole >= 3) {
            requestUrl += `&userRole=${loggedUser.data.userRole}`;
        }

        if (typeof options != "undefined" && options != "") {
            requestUrl += `&project=${options}`;
        }

        if (loggedUser.data.userRole == 4) {
            requestUrl += `&typeId=2&typeId=3`;
        }

        if (loggedUser.data.userRole > 4) {
            requestUrl += `&typeId=1`;
        }

        getData(requestUrl, {}, c => {
            const projectOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.project };
                })
                .value();
            dispatch({ type: "SET_PROJECT_SELECT_LIST", List: projectOptions });
        });
    }

    fetchWorkstreamList(options) {
        const { dispatch, task, loggedUser, project } = { ...this.props };
        const { Selected } = task;
        const projectId = Selected.projectId || project.Selected.id;

        let fetchUrl = `/api/workstream?projectId=${projectId}&page=1&userId=${loggedUser.data.id}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&workstream=${options}`;
        }
        getData(fetchUrl, {}, c => {
            const workstreamOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.workstream };
                })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    fetchApproverMembers(options) {
        const { dispatch, task, project } = { ...this.props };
        const { Selected } = task;
        const projectId = Selected.projectId || project.Selected.id;

        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${projectId}&linkType=project&memberType=approver`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }
        getData(fetchUrl, {}, c => {
            const getApproverSelectList = _(c.data)
                .map(o => {
                    return { id: o.id, name: o.firstName + " " + o.lastName, image: o.avatar };
                })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: getApproverSelectList });
        });
    }

    getTaskDetails() {
        const { dispatch, task } = { ...this.props };

        getData(`/api/task/detail/${task.Selected.id}`, {}, c => {
            if (c.status === 200 && !c.data.error) {
                this.setState({
                    currentData: c.data
                });
                dispatch({ type: "SET_CHECKLIST", list: c.data.checklist });
            } else {
                showToast('error', c.data.message)
            }
        });

        getData(`/api/taskDependency?includes=task&taskId=${task.Selected.id}`, {}, c => {
            dispatch({ type: "SET_TASK_DEPENDENCY_LIST", List: c.data });
        });
    }

    handleChange(e) {
        let { dispatch, task } = this.props;
        let Selected = Object.assign({}, task.Selected);
        Selected[e.target.name] = e.target.value;

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
    }

    handleDate(value, name) {
        const { dispatch, task } = this.props;
        const selectedDate = value != "" ? moment(new Date(value)) : "";
        let selectedObj = Object.assign({}, { ...task.Selected });
        if ((name == "startDate" && (typeof selectedObj.dueDate != "undefined" && selectedObj.dueDate != "")) || (name == "dueDate" && (typeof selectedObj.startDate != "undefined" && selectedObj.startDate != ""))) {
            const startDate = moment(selectedObj.startDate);
            const dueDate = moment(selectedObj.dueDate);
            const comparison = name == "startDate" ? moment(dueDate).diff(value, "days") : moment(value).diff(startDate, "days");

            if (comparison < 0) {
                showToast("error", "Due date must be after the start date.");
                selectedObj[name] = undefined;
            } else {
                selectedObj[name] = selectedDate;
            }
        } else {
            selectedObj[name] = selectedDate;
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });
    }

    setDropDown(name, value) {
        const { dispatch, task } = this.props;
        const selectedObj = { ...task.Selected, [name]: value };

        if (name == "dependency_type" && value == "") {
            selectedObj["task_dependency"] = [];
        }

        if (name == "projectId" && value != "") {
            selectedObj["projectId"] = value;
            selectedObj["workstreamId"] = "";
            selectedObj["approverId"] = "";
            dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: "" });
        }

        if (name == "projectId" && (typeof selectedObj.projectId != "undefined" && selectedObj.projectId != "")) {
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                this.fetchWorkstreamList();
                this.fetchApproverMembers();
                this.fetchAssignList();
            }, 1500);
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });
    }

    handleCheckbox(name, value) {
        let { dispatch, task } = this.props;
        let Selected = Object.assign({}, task.Selected);
        Selected[name] = value;

        if (name == "periodic") {
            Selected = { ...Selected, dueDate: "", taskDueDate: "", periodType: "", period: value == 1 ? 1 : 0, periodInstance: value == 1 ? 1 : 0 };
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
    }

    isDefaultAssignee() {
        const { users, task } = { ...this.props };
        let assignedList = _.cloneDeep(users.SelectList);
        let isDefault = false;

        const userAssigned = _.find(task.Selected.task_members, ({ memberType }) => {
            return memberType == "assignedTo";
        });

        if (typeof userAssigned != "undefined") {
            assignedList.push({ id: userAssigned.user.id, name: userAssigned.user.firstName + " " + userAssigned.user.lastName, image: userAssigned.user.avatar });
        }

        const assgined = _.find(assignedList, { id: task.Selected.assignedTo });

        if (assgined && assgined.name.split(" ")[0] === "default") {
            isDefault = true;
        }

        return isDefault;
    }

    handleSubmit() {
        const { task, dispatch, loggedUser, project, workstream } = this.props;
        let result = true;

        $("#task-form *").validator("validate");
        $("#task-form .form-group").each(function () {
            if ($(this).hasClass("has-error")) {
                result = false;
            }
        });

        if (typeof task.Selected.dueDate == "undefined" || task.Selected.dueDate == "") {
            $("#dueDate").addClass("border-red");
            result = false;
        }

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
            const submitData = {
                ...task.Selected,
                approverId: task.Selected.approvalRequired > 0 ? task.Selected.approverId : null,
                userId: loggedUser.data.id,
                projectId: task.Selected.projectId || project.Selected.id,
                workstreamId: task.Selected.workstreamId || workstream.Selected.id,
                period: typeof task.Selected.period != "undefined" && task.Selected.period != "" && task.Selected.period != null ? _.toNumber(task.Selected.period) : 0,
                periodInstance: typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1 && typeof task.Selected.periodInstance != "undefined" ? task.Selected.periodInstance : task.Selected.periodic == 1 ? 1 : 0,
                status: task.Selected.status == null || task.Selected.status == "" ? "In Progress" : task.Selected.status,
                dueDate: typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "" && task.Selected.dueDate != null ? moment(task.Selected.dueDate).format("YYYY-MM-DD HH:mm:ss") : null,
                startDate: typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "" && task.Selected.startDate != null ? moment(task.Selected.startDate).format("YYYY-MM-DD HH:mm:ss") : null,
                dateUpdated: moment().format("YYYY-MM-DD HH:mm:ss")
            };

            $("#task-form").validator("destroy");

            if (this.isDefaultAssignee(submitData.task_members)) {
                showToast("error", "Please assign to a new user.");
                return;
            }

            dispatch({ type: "SET_TASK_LOADING", Loading: "SUBMITTING" });

            if (typeof task.Selected.id != "undefined") {
                putData(`/api/task/${task.Selected.id}`, submitData, c => {
                    if (c.status == 200) {
                        showToast("success", "Task successfully updated.", undefined, true);
                    } else {
                        showToast("error", c.response.data.message);
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            } else {
                postData(`/api/task`, submitData, c => {
                    if (c.status == 200 && !c.data.error) {
                        const { id, approvalRequired, approverId, dueDate, startDate, periodic, period, periodInstance, periodType, projectId, workstream, task, task_members, checklist, description } = { ...c.data[0] };
                        dispatch({
                            type: "SET_TASK_SELECTED",
                            Selected: {
                                id,
                                approvalRequired,
                                approverId,
                                ...(task_members.length > 0 ? { assignedTo: task_members[0].userTypeLinkId } : {}),
                                dueDate: dueDate != null ? moment(dueDate) : null,
                                startDate: startDate != null ? moment(startDate) : null,
                                description,
                                periodic,
                                period,
                                periodInstance,
                                periodType,
                                projectId,
                                task,
                                workstream,
                                workstreamId: workstream.id,
                                checklist
                            }
                        });
                        this.getTaskDetails();
                        showToast("success", "Task successfully added.", undefined, true);
                    } else {
                        showToast("error", c.data.error);
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            }
        }
    }

    deleteTaskDependency(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: { ...value, action: "delete" } });
        $("#delete-taskDependency").modal("show");
    }

    confirmDeleteTaskDependency() {
        const { dispatch, loggedUser, taskDependency } = this.props;

        deleteData(`/api/taskDependency/${taskDependency.Selected.id}?userId=${loggedUser.data.id}`, {}, c => {
            dispatch({ type: "DELETE_TASK_DEPENDENCY", id: taskDependency.Selected.id });
            showToast("success", "Task Dependency successfully deleted.");
            $("#delete-taskDependency").modal("hide");
        });
    }

    renderArrayTd(arr) {
        return arr.join("\r\n");
    }

    onChangeRaw(e) {
        const { task } = this.props;
        let Selected = Object.assign({}, task.Selected);

        if (moment(e.target.value, "MMMM DD, YYYY", true).isValid() == false) {
            let { dispatch, task } = this.props;
            let Selected = Object.assign({}, task.Selected);

            Selected[e.target.name] = null;

            dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
        }
    }

    render() {
        const { dispatch, task, users, project, workstream, taskDependency, members, loggedUser, settings } = { ...this.props };
        const taskDependencyValue = typeof taskDependency.task != "undefined" && _.isEmpty(taskDependency.Selected) == false ? taskDependency.task.task : "";
        let projectList = _.cloneDeep(project.SelectList);
        let workstreamList = _.cloneDeep(workstream.SelectList);
        let assignedList = _.cloneDeep(users.SelectList);
        let approverList = _.cloneDeep(members.SelectList);

        if (typeof task.Selected.id != "undefined") {
            const { project } = task.Selected.workstream;
            const userAssigned = _.find(task.Selected.task_members, ({ memberType }) => {
                return memberType == "assignedTo";
            });
            const userApprover = _.find(task.Selected.task_members, ({ memberType }) => {
                return memberType == "approver";
            });

            projectList.push({ id: project.id, name: project.project });
            workstreamList.push({ id: task.Selected.workstream.id, name: task.Selected.workstream.workstream });

            if (typeof userAssigned != "undefined" && userAssigned.user) {
                assignedList.push({ id: userAssigned.user.id, name: userAssigned.user.firstName + " " + userAssigned.user.lastName, image: userAssigned.user.avatar });
            }

            if (typeof userApprover != "undefined" && userApprover.user) {
                approverList.push({ id: userApprover.user.id, name: userApprover.user.firstName + " " + userApprover.user.lastName, image: userApprover.user.avatar });
            }
        }

        if (typeof project.Selected.id != "undefined") {
            projectList.push({ id: project.Selected.id, name: project.Selected.project });
        }

        if (typeof workstream.Selected.id != "undefined") {
            workstreamList.push({ id: workstream.Selected.id, name: workstream.Selected.workstream });
        }
        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true" />
                                </a>
                                {typeof task.Selected.id != "undefined" && task.Selected.id != "" ? "Edit " : "Add New "}
                                Task
                            </h4>
                        </div>
                        <div class="card-body">
                            <form id="task-form" class="full-form mb20">
                                <div class="mb20">
                                    <p class="form-header mb0">Task Details</p>
                                    <p>
                                        All with <span class="text-red">*</span> are required.
                                    </p>
                                </div>
                                <div class="row content-row mb20">
                                    <div class="col-lg-8 md-12 col-sm-12">
                                        <div class="form-group input-inline">
                                            <input
                                                type="text"
                                                name="task"
                                                required
                                                value={typeof task.Selected.task == "undefined" ? "" : task.Selected.task}
                                                id="task-name"
                                                class="form-control underlined"
                                                placeholder="Write task name"
                                                onChange={this.handleChange}
                                                disabled={loggedUser.data.userRole >= 4 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                            />
                                        </div>
                                        <div class="mt20">
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline ${typeof project.Selected.id != "undefined" ? "pointer-none" : ""}`}>
                                                        <label for="email">
                                                            Project: <span class="text-red">*</span>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={projectList}
                                                            onInputChange={this.setProjectList}
                                                            selected={typeof project.Selected.id != "undefined" ? project.Selected.id : typeof task.Selected.projectId == "undefined" ? "" : task.Selected.projectId}
                                                            onChange={e => {
                                                                this.setDropDown("projectId", e == null ? "" : e.value);
                                                            }}
                                                            placeholder={"Search project"}
                                                        />
                                                    </div>
                                                </div>
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline ${workstream.Loading == "RETRIEVING" || typeof workstream.Selected.id != "undefined" ? "pointer-none" : ""}`}>
                                                        <label>
                                                            Workstream: <span class="text-red">*</span>
                                                            <p class="m0 note">Select a project first.</p>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={_.uniqBy(workstreamList, "id")}
                                                            onInputChange={this.setWorkstreamList}
                                                            selected={typeof workstream.Selected.id != "undefined" ? workstream.Selected.id : typeof task.Selected.workstreamId == "undefined" ? "" : task.Selected.workstreamId}
                                                            onChange={e => {
                                                                this.setDropDown("workstreamId", e == null ? "" : e.value);
                                                            }}
                                                            placeholder={"Search workstream"}
                                                            disabled={loggedUser.data.userRole >= 4 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                        />
                                                        <div class="loading">
                                                            {workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline ${(typeof task.Selected.projectId == "undefined" && typeof project.Selected.id == "undefined") || workstream.Loading == "RETRIEVING" ? "pointer-none" : ""}`}>
                                                        <label for="email">
                                                            Assigned: <span class="text-red">*</span>
                                                            <p class="m0 note">Select a project first.</p>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={_.uniqBy(assignedList, "id")}
                                                            onInputChange={this.setAssignMemberList}
                                                            selected={typeof task.Selected.assignedTo == "undefined" ? "" : task.Selected.assignedTo}
                                                            onChange={e => {
                                                                this.setDropDown("assignedTo", e == null ? "" : e.value);
                                                            }}
                                                            placeholder={"Search name"}
                                                            disabled={
                                                                loggedUser.data.userRole >= 4 &&
                                                                ((typeof task.Selected.workstream != "undefined" || typeof workstream.Selected.id != "undefined") &&
                                                                    (typeof project.Selected.type != "undefined" && project.Selected.type.type == "Client"))
                                                            }
                                                            customLabel={o => {
                                                                return (
                                                                    <div class="drop-profile">
                                                                        {o.image != "" && <img
                                                                            src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                                            alt="Profile Picture" class="img-responsive" />}
                                                                        <p class="m0">{o.label}</p>
                                                                    </div>
                                                                );
                                                            }}
                                                            customSelected={({ value: o }) => {
                                                                return (
                                                                    <div class="drop-profile" title={o.label}>
                                                                        {o.image != "" && <img
                                                                            src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                                            alt="Profile Picture" class="img-responsive" />}
                                                                        <p class="m0">
                                                                            {o.label.substring(0, 17)}
                                                                            {o.label.length > 17 ? "..." : ""}
                                                                        </p>
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                        <div class="loading">
                                                            {workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <div>
                                                            <label>Start Date:</label>
                                                            {typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null && task.Selected.startDate != "" && (
                                                                <p class="m0 note">
                                                                    <a onClick={() => this.handleDate("", "startDate")}>Clear</a>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <DatePicker
                                                                name="startDate"
                                                                dateFormat="MMMM DD, YYYY"
                                                                onChange={date => {
                                                                    this.handleDate(date, "startDate");
                                                                }}
                                                                value={moment(task.Selected.startDate, "MMMM DD, YYYY", true).isValid() ? moment(task.Selected.startDate).format("MMMM DD, YYYY") : ""}
                                                                placeholderText="Select valid start date"
                                                                class="form-control"
                                                                onBlur={this.onChangeRaw}
                                                                ref="startDate"
                                                                disabled={loggedUser.data.userRole >= 4 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                                selected={typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null && task.Selected.startDate != "" ? task.Selected.startDate : null}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline`}>
                                                        <div>
                                                            <label>
                                                                Due Date: <span class="text-red">*</span>
                                                            </label>

                                                            {typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null && task.Selected.dueDate != "" && (
                                                                <p class="m0 note">
                                                                    <a onClick={() => this.handleDate("", "dueDate")}>Clear</a>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <DatePicker
                                                            name="dueDate"
                                                            dateFormat="MMMM DD, YYYY"
                                                            onChange={date => {
                                                                this.handleDate(date, "dueDate");
                                                            }}
                                                            value={moment(task.Selected.dueDate, "MMMM DD, YYYY", true).isValid() ? moment(task.Selected.dueDate).format("MMMM DD, YYYY") : ""}
                                                            onBlur={this.onChangeRaw}
                                                            required={true}
                                                            placeholderText="Select valid start date"
                                                            class="form-control"
                                                            disabled={loggedUser.data.userRole >= 4 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                            selected={typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null && task.Selected.dueDate != "" ? task.Selected.dueDate : null}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt20 row">
                                                <div class="col-lg-12 col-sm-12">
                                                    <textarea
                                                        name="description"
                                                        value={typeof task.Selected.description == "undefined" || task.Selected.description == null ? "" : task.Selected.description}
                                                        class="form-control underlined"
                                                        placeholder="Add description..."
                                                        onChange={this.handleChange}
                                                        disabled={loggedUser.data.userRole >= 4 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-lg-4 md-12 col-sm-12">
                                        <div class={loggedUser.data.userType === "External" ? "pointer-none" : ""}>
                                            <label class="custom-checkbox">
                                                Needs Approval
                                                <input
                                                    type="checkbox"
                                                    checked={task.Selected.approvalRequired ? true : false}
                                                    onChange={() => { }}
                                                    onClick={f => {
                                                        this.handleCheckbox("approvalRequired", task.Selected.approvalRequired ? 0 : 1);
                                                    }}
                                                    disabled={loggedUser.data.userRole > 5 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                />
                                                <span class="checkmark" />
                                            </label>
                                        </div>
                                        {typeof task.Selected.approvalRequired != "undefined" && task.Selected.approvalRequired != "" && (
                                            <div class="form-group">
                                                <label class="m0">
                                                    Approver:<span class="text-red">*</span>
                                                </label>
                                                {/* <p class="note mb5">Select a project first.</p> */}
                                                <div class={`input-inline ${(typeof task.Selected.projectId == "undefined" && typeof project.Selected.id == "undefined") || workstream.Loading == "RETRIEVING" ? "pointer-none" : ""}`}>
                                                    <DropDown
                                                        required={true}
                                                        options={_.uniqBy(approverList, "id")}
                                                        onInputChange={this.setApproverList}
                                                        selected={typeof task.Selected.approverId == "undefined" ? "" : task.Selected.approverId}
                                                        onChange={e => {
                                                            this.setDropDown("approverId", e == null ? "" : e.value);
                                                        }}
                                                        placeholder={"Search Approver"}
                                                        disabled={loggedUser.data.userRole > 5 && (typeof task.Selected.workstream != "undefined" && project.Selected.type.type == "Client")}
                                                        customLabel={o => {
                                                            return (
                                                                <div class="drop-profile">
                                                                    {typeof o.image != "undefined" && o.image != "" && <img
                                                                        src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                                        alt="Profile Picture" class="img-responsive" />}
                                                                    <p class="m0">{o.label}</p>
                                                                </div>
                                                            );
                                                        }}
                                                        customSelected={({ value: o }) => {
                                                            return (
                                                                <div class="drop-profile">
                                                                    {o.image != "" && <img
                                                                        src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                                        alt="Profile Picture" class="img-responsive" />}
                                                                    <p class="m0">{o.label}</p>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                    <div class="loading">{workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div class={loggedUser.data.userType === "External" ? "pointer-none" : ""}>
                                            <label class="custom-checkbox">
                                                Recurring Task
                                                <input
                                                    type="checkbox"
                                                    checked={task.Selected.periodic ? true : false}
                                                    onChange={() => { }}
                                                    onClick={f => {
                                                        this.handleCheckbox("periodic", task.Selected.periodic ? 0 : 1);
                                                    }}
                                                />
                                                <span class="checkmark" />
                                            </label>
                                        </div>
                                        <div class={loggedUser.data.userType === "External" ? "pointer-none" : ""}>
                                            {typeof task.Selected.periodic != "undefined" && task.Selected.periodic != "" && (
                                                <div>
                                                    <div class="row">
                                                        <div class="col-lg-8 md-8 col-sm-8">
                                                            <div class="form-group">
                                                                <label>
                                                                    Instance:<span class="text-red">*</span>
                                                                </label>
                                                                <input
                                                                    min="1"
                                                                    max="10"
                                                                    type="number"
                                                                    name="periodInstance"
                                                                    required
                                                                    value={typeof task.Selected.periodInstance == "undefined" ? "" : task.Selected.periodInstance}
                                                                    class="form-control"
                                                                    placeholder="Enter number instance"
                                                                    onChange={this.handleChange}
                                                                // disabled={currentData.periodType}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {typeof task.Selected.periodic != "undefined" && task.Selected.periodic != "" && (
                                                <div class={loggedUser.data.userType === "External" ? "pointer-none" : ""}>
                                                    <div class="row">
                                                        <div class="col-lg-8 md-8 col-sm-8">
                                                            <div class="form-group">
                                                                <label>
                                                                    Period:<span class="text-red">*</span>
                                                                </label>
                                                                <DropDown
                                                                    multiple={false}
                                                                    required={true}
                                                                    options={_.map(["Year", "Month", "Week", "Day"], o => {
                                                                        return { id: (o + "s").toLowerCase(), name: o };
                                                                    })}
                                                                    selected={typeof task.Selected.periodType == "undefined" ? "" : task.Selected.periodType}
                                                                    onChange={e => this.setDropDown("periodType", e.value)}
                                                                // disabled={currentData.periodType}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <a class="btn btn-violet mr5" onClick={this.handleSubmit} disabled={task.Loading == "SUBMITTING"}>
                                    <span>{task.Loading == "SUBMITTING" ? "Creating..." : typeof task.Selected.id != "undefined" && task.Selected.id != "" ? "Save Task" : "Create Task"}</span>
                                </a>
                                <a
                                    class="btn btn-default"
                                    onClick={e => {
                                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <span>Cancel</span>
                                </a>
                            </form>
                            {typeof task.Selected.id != "undefined" && task.Selected.id != "" && loggedUser.data.userRole <= 4 && (
                                <div class="bt mb20">
                                    <div class="row">
                                        <div class=" col-lg-12 md-12 col-sm-12">
                                            <div class="mt20 mb20">
                                                <p class="form-header mb0">Task Dependencies</p>
                                                <p>
                                                    All with <span class="text-red">*</span> are required.
                                                </p>
                                            </div>
                                            <TaskDependency />
                                            <div class={taskDependency.Loading == "RETRIEVING" && taskDependency.List.length == 0 ? "linear-background mt20" : "mt20"}>
                                                {taskDependency.List.length > 0 && (
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th scope="col" class="td-left">
                                                                    Task
                                                                </th>
                                                                <th scope="col">Dependency Type</th>
                                                                <th scope="col">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {_.map(taskDependency.List, (o, index) => {
                                                                const { task, dependencyType } = o;

                                                                return (
                                                                    <tr key={index}>
                                                                        <td data-label="Task" class="td-left">
                                                                            {task.task}
                                                                        </td>
                                                                        <td data-label="Dependency Type">{dependencyType}</td>
                                                                        <td data-label="Action">
                                                                            <a href="javascript:void(0);" onClick={e => this.deleteTaskDependency(o)} class="btn btn-action">
                                                                                <span class="fa fa-trash" />
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                )}
                                                {taskDependency.List.length == 0 && taskDependency.Loading != "RETRIEVING" && (
                                                    <p class="mb0 text-center">
                                                        <strong>No Records Found</strong>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Modals */}
                <DeleteModal id="delete-taskDependency" type={"task dependency"} type_value={taskDependencyValue} delete_function={this.confirmDeleteTaskDependency} />
            </div>
        );
    }
}
