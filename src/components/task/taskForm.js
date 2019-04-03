import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { showToast, postData, putData, getData, deleteData, setDatePicker, displayDate } from '../../globalFunction';
import { DropDown, DeleteModal } from "../../globalComponents";

import TaskDependency from "./taskDependency";
import TaskChecklist from "./taskChecklist";
import TaskDocument from "./taskDocument";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

let keyTimer = "";

@connect((store) => {
    return {
        checklist: store.checklist,
        loggedUser: store.loggedUser,
        members: store.members,
        project: store.project,
        task: store.task,
        taskDependency: store.taskDependency,
        users: store.users,
        workstream: store.workstream,
        document: store.document
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
            "setApproverList",
            "handleCheckbox",
            "handleSubmit",
            "getTaskDetails",
            "fetchProjectMembers",
            "deleteSubTask",
            "confirmDeleteSubtask",
            "confirmDeleteTaskDependency",
            "generateDueDate",
            "deleteDocument",
            "renderArrayTd",
            "confirmDeleteDocument",
            "onChangeRaw"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }
    componentDidMount() {
        const { task } = { ...this.props };

        this.fetchUserList();
        this.fetchProjectList();

        if (typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") {
            this.fetchWorkstreamList();
            this.fetchProjectMembers();
            this.getTaskDetails();
        }
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

    setApproverList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchProjectMembers(options);
        }, 1500);
    }

    fetchUserList(options) {
        const { dispatch, task } = { ...this.props };
        const { Selected } = task;
        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${Selected.projectId}&linkType=project`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const usersOptions = _(c.data)
                .map((o) => { return { id: o.id, name: o.firstName + " " + o.lastName } })
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

    fetchProjectMembers(options) {
        const { dispatch, task } = { ...this.props };
        const { Selected } = task;
        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${Selected.projectId}&linkType=project`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const getApproverSelectList = _(c.data)
                .filter((o) => {
                    return (_.filter(o.user_role, (role) => { return role.role.id <= 3 })).length > 0;
                })
                .map((o) => { return { id: o.id, name: o.firstName + " " + o.lastName } })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: getApproverSelectList });
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

    handleDate(value, name) {
        const { dispatch, task } = this.props;
        const selectedDate = (value != '') ? moment(new Date(value)) : '';
        let selectedObj = Object.assign({}, { ...task.Selected })
        if (
            (name == "startDate" && (typeof selectedObj.dueDate != "undefined" && selectedObj.dueDate != "")) ||
            (name == "dueDate" && (typeof selectedObj.startDate != "undefined" && selectedObj.startDate != ""))
        ) {
            const startDate = moment(selectedObj.startDate);
            const dueDate = moment(selectedObj.dueDate);
            const comparison = (name == "startDate") ? moment(dueDate).diff(value, 'days') : moment(value).diff(startDate, 'days');

            if (comparison < 0) {
                showToast("error", "Due date must be after the start date.");
                selectedObj[name] = undefined;
            } else {
                selectedObj[name] = selectedDate;
            }
        } else {
            selectedObj[name] = selectedDate;
        }
        if (name == "startDate" && task.Selected.periodic == 1) {
            setTimeout(() => { this.generateDueDate() }, 500);
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });
    }

    setDropDown(name, value) {
        const { dispatch, task } = this.props
        const selectedObj = { ...task.Selected, [name]: value };

        if (name == "dependency_type" && value == "") {
            selectedObj["task_dependency"] = [];
        }

        if (name == "projectId" && value != "") {
            selectedObj["workstreamId"] = "";
            selectedObj["approverId"] = "";
            dispatch({ type: "SET_TASK_DEPENDENCY_SELECTED", Selected: "" })
        }

        if (name == "projectId" && (typeof selectedObj.projectId != "undefined" && selectedObj.projectId != "")) {
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                this.fetchWorkstreamList();
                this.fetchProjectMembers();
                this.fetchUserList();
            }, 1500);
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: selectedObj });

        if (name == "periodType" && (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "")) {
            setTimeout(() => { this.generateDueDate() }, 500);
        }

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

        if (typeof task.Selected.dueDate == "undefined" || task.Selected.dueDate == "") {
            $("#dueDate").addClass("border-red");
            result = false;
        }


        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
            const submitData = {
                ...task.Selected,
                approverId: (task.Selected.approvalRequired > 0) ? task.Selected.approverId : "",
                userId: loggedUser.data.id,
                projectId: task.Selected.projectId,
                period: (typeof task.Selected.period != "undefined" && task.Selected.period != "" && task.Selected.period != null) ? _.toNumber(task.Selected.period) : 0,
                periodInstance: (typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1) ? 3 : 0,
                status: (task.Selected.approvalRequired == 1 && (typeof task.Selected.status == "undefined" || task.Selected.status == null || task.Selected.status == "For Approval")) ? "For Approval" : (task.Selected.status == null || task.Selected.status == "") ? "In Progress" : task.Selected.status,
                dueDate: (typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "" && task.Selected.dueDate != null) ? moment(task.Selected.dueDate).format('YYYY-MM-DD HH:mm:ss') : null,
                startDate: (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "" && task.Selected.startDate != null) ? moment(task.Selected.startDate).format('YYYY-MM-DD HH:mm:ss') : null,
                dateUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
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
                            approverId,
                            dueDate,
                            startDate,
                            periodic,
                            period,
                            periodInstance,
                            periodType,
                            projectId,
                            workstream,
                            task,
                            task_members,
                            checklist,
                            description
                        } = { ...c.data[0] };
                        dispatch({
                            type: "SET_TASK_SELECTED", Selected: {
                                id,
                                approvalRequired,
                                approverId,
                                ...(task_members.length > 0) ? { assignedTo: task_members[0].userTypeLinkId } : {},
                                dueDate: (dueDate != null) ? moment(dueDate) : null,
                                startDate: (startDate != null) ? moment(startDate) : null,
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
        const { checklist, dispatch, task, loggedUser } = this.props;
        const { Selected } = checklist;

        deleteData(`/api/checklist/${Selected.id}?taskId=${task.Selected.id}&userId=${loggedUser.data.id}`, {}, (c) => {
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

    generateDueDate() {
        const { dispatch, task } = this.props;
        const { Selected } = task;
        const { startDate, periodType } = Selected;
        const computedDueDate = (moment(startDate, "YYYY MMM DD").add(1, periodType)).format("YYYY MMM DD");
        dispatch({ type: "SET_TASK_SELECTED", Selected: { ...Selected, dueDate: computedDueDate } });
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    deleteDocument(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...value, action: 'delete' } });
        $('#delete-document').modal("show");
    }

    confirmDeleteDocument() {
        const { dispatch, document, task } = this.props;
        deleteData(`/api/task/document/${document.Selected.id}?type=${document.Selected.type}`, {}, (c) => {
            if (document.Selected.type == "Task Document") {
                const taskDocument = _.filter(task.Selected.tag_task, (o) => {
                    return o.document.id != document.Selected.id;
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, tag_task: taskDocument } });
            } else {
                const checklist = _.map(task.Selected.checklist, (o) => {
                    return { ...o, tagDocuments: _.filter(o.tagDocuments, (o) => { return o.id != document.Selected.id }) }
                });
                dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, checklist } });
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            showToast("success", "Task Document successfully deleted.");
            $('#delete-document').modal("hide");
        });
    }

    onChangeRaw(e) {
        const { dispatch, task } = this.props;
        let Selected = Object.assign({}, task.Selected);

        if (moment(e.target.value, 'MMMM DD, YYYY', true).isValid() == false) {
            let { dispatch, task } = this.props
            let Selected = Object.assign({}, task.Selected)

            Selected[e.target.name] = null;

            dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
        }

    }

    render() {
        const { dispatch, task, users, project, workstream, checklist, taskDependency, members, document } = { ...this.props };
        const checklistTypeValue = (typeof checklist.Selected.description != "undefined" && _.isEmpty(checklist.Selected) == false) ? checklist.Selected.description : "";
        const taskDependencyValue = (typeof taskDependency.task != "undefined" && _.isEmpty(taskDependency.Selected) == false) ? taskDependency.task.task : "";
        const documentValue = (typeof document.Selected != "undefined" && _.isEmpty(document.Selected) == false) ? document.Selected.name : "";
        const checklistDocuments = _(task.Selected.checklist)
            .flatMap((o) => {
                return _.map(o.tagDocuments, (o) => {
                    return {
                        id: o.id,
                        name: o.document.origin,
                        type: "Subtask Document",
                        dateAdded: o.document.dateAdded,
                        child: _(task.Selected.checklist)
                            .filter((check) => { return check.id == o.checklistId })
                            .map((o) => { return o.description })
                            .value()
                    };
                })
            })
            .value();
        const taskDocuments = _(task.Selected.tag_task)
            .filter((o) => { return o.tagType == "document" })
            .map((o) => {
                return {
                    id: o.document.id,
                    name: o.document.origin,
                    type: "Task Document",
                    dateAdded: o.document.dateAdded
                };
            })
            .value();
        const documentList = [...checklistDocuments, ...taskDocuments];
        return (
            <div class="row" >
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
                                                    <div class={`form-group input-inline ${(workstream.Loading == "RETRIEVING" || typeof task.Selected.projectId == "undefined" || task.Selected.projectId == "") ? "pointer-none" : ""}`}>
                                                        <label for="email">
                                                            Assigned: <span class="text-red">*</span>
                                                            <p class="m0 note">Please select a project first.</p>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={users.SelectList}
                                                            onInputChange={this.setAssignMemberList}
                                                            selected={(typeof task.Selected.assignedTo == "undefined") ? "" : task.Selected.assignedTo}
                                                            onChange={(e) => {
                                                                this.setDropDown("assignedTo", (e == null) ? "" : e.value);
                                                            }}
                                                            placeholder={'Search name'}
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
                                                        <label for="email">Project: <span class="text-red">*</span></label>
                                                        <DropDown
                                                            required={true}
                                                            options={project.SelectList}
                                                            onInputChange={this.setProjectList}
                                                            selected={(typeof task.Selected.projectId == "undefined") ? "" : task.Selected.projectId}
                                                            onChange={(e) => {
                                                                this.setDropDown("projectId", (e == null) ? "" : e.value);
                                                            }}
                                                            disabled={(typeof task.Selected.id != "undefined" && task.Selected.id != "")}
                                                            placeholder={'Search project'}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline ${(workstream.Loading == "RETRIEVING" || typeof task.Selected.projectId == "undefined" || task.Selected.projectId == "") ? "pointer-none" : ""}`}>
                                                        <label>
                                                            Workstream: <span class="text-red">*</span>
                                                            <p class="m0 note">Please select a project first.</p>
                                                        </label>
                                                        <DropDown
                                                            required={true}
                                                            options={workstream.SelectList}
                                                            onInputChange={this.setWorkstreamList}
                                                            selected={(typeof task.Selected.workstreamId == "undefined") ? "" : task.Selected.workstreamId}
                                                            onChange={(e) => {
                                                                this.setDropDown("workstreamId", (e == null) ? "" : e.value);
                                                            }}
                                                            placeholder={'Search workstream'}
                                                        />
                                                        <div class="loading">
                                                            {
                                                                (workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mt10 row">
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class="form-group input-inline">
                                                        <div>
                                                            <label>
                                                                Start Date:
                                                            </label>
                                                            {
                                                                (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null && task.Selected.startDate != '') && <p class="m0 note"><a onClick={() => this.handleDate("", 'startDate')}>Clear</a></p>
                                                            }
                                                        </div>
                                                        <div>
                                                            <DatePicker
                                                                name="startDate"
                                                                dateFormat="MMMM DD, YYYY"
                                                                onChange={date => {
                                                                    this.handleDate(date, 'startDate');
                                                                }}
                                                                value={(moment(task.Selected.startDate, 'MMMM DD, YYYY', true).isValid()) ? moment(task.Selected.startDate).format('MMMM DD, YYYY') : ""}
                                                                placeholderText="Select valid start date"
                                                                class="form-control"
                                                                onBlur={this.onChangeRaw}
                                                                ref="startDate"
                                                                selected={(typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null && task.Selected.startDate != '') ? task.Selected.startDate : null}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="col-lg-6 col-sm-6">
                                                    <div class={`form-group input-inline ${(typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null && task.Selected.startDate != '' && task.Selected.periodic == 1) ? "pointer-none" : ""}`}>
                                                        <div>
                                                            <label>
                                                                Due Date: <span class="text-red">*</span>
                                                            </label>

                                                            {
                                                                (typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null && task.Selected.dueDate != '') && <p class="m0 note"><a onClick={() => this.handleDate("", 'dueDate')}>Clear</a></p>
                                                            }
                                                        </div>
                                                        <DatePicker
                                                            name="dueDate"
                                                            dateFormat="MMMM DD, YYYY"
                                                            onChange={date => {
                                                                this.handleDate(date, 'dueDate');
                                                            }}
                                                            value={(moment(task.Selected.dueDate, 'MMMM DD, YYYY', true).isValid()) ? moment(task.Selected.dueDate).format('MMMM DD, YYYY') : ""}
                                                            onBlur={this.onChangeRaw}
                                                            required={true}
                                                            placeholderText="Select valid start date"
                                                            class="form-control"
                                                            selected={(typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null && task.Selected.dueDate != '') ? task.Selected.dueDate : null}
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
                                            <label class="custom-checkbox">
                                                Needs Approval
                                                <input
                                                    type="checkbox"
                                                    checked={task.Selected.approvalRequired ? true : false}
                                                    onChange={() => { }}
                                                    onClick={(f) => { this.handleCheckbox("approvalRequired", (task.Selected.approvalRequired) ? 0 : 1) }}
                                                />
                                                <span class="checkmark"></span>
                                            </label>
                                        </div>
                                        {
                                            (typeof task.Selected.approvalRequired != "undefined" && task.Selected.approvalRequired != "") && <div>
                                                <div class="row">
                                                    <div class="col-lg-8 md-8 col-sm-8">
                                                        <div class="form-group">
                                                            <label class="m0">
                                                                Approver:<span class="text-red">*</span>
                                                            </label>
                                                            <p class="m0 note">Please select a project first.</p>
                                                            <div class={`input-inline ${(workstream.Loading == "RETRIEVING" || typeof task.Selected.projectId == "undefined" || task.Selected.projectId == "") ? "pointer-none" : ""}`}>
                                                                <DropDown
                                                                    required={(task.Selected.periodic == 1)}
                                                                    options={members.SelectList}
                                                                    onInputChange={this.setApproverList}
                                                                    selected={(typeof task.Selected.approverId == "undefined") ? "" : task.Selected.approverId}
                                                                    onChange={(e) => {
                                                                        this.setDropDown("approverId", (e == null) ? "" : e.value);
                                                                    }}
                                                                    placeholder={'Search Approver'}
                                                                />
                                                                <div class="loading">
                                                                    {
                                                                        (workstream.Loading == "RETRIEVING" && typeof task.Selected.projectId != "undefined" && task.Selected.projectId != "") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        }
                                        <div>
                                            <label class="custom-checkbox">
                                                Recurring Task
                                                <input
                                                    type="checkbox"
                                                    checked={task.Selected.periodic ? true : false}
                                                    onChange={() => { }}
                                                    onClick={(f) => { this.handleCheckbox("periodic", (task.Selected.periodic) ? 0 : 1) }}
                                                />
                                                <span class="checkmark"></span>
                                            </label>
                                        </div>
                                        {
                                            (typeof task.Selected.periodic != "undefined" && task.Selected.periodic != "") && <div>
                                                <div class="row">
                                                    <div class="col-lg-8 md-8 col-sm-8">
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
                                            <TaskChecklist />
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
                                                <p class="form-header mb0">Task Documents</p>
                                                <p>All with <span class="text-red">*</span> are required.</p>
                                            </div>
                                            <TaskDocument />
                                            <div class="mt20">
                                                {
                                                    ((documentList).length > 0) && <table>
                                                        <thead>
                                                            <tr>
                                                                <th scope="col" class="td-left">File Name</th>
                                                                <th scope="col">Upload Type</th>
                                                                <th scope="col">Subtasks</th>
                                                                <th scope="col">Upload Date</th>
                                                                <th scope="col">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                _.map(documentList, ({ id, name, type, child = [], dateAdded }, index) => {
                                                                    return (
                                                                        <tr key={index}>
                                                                            <td data-label="File Name" class="td-left">
                                                                                {name}
                                                                            </td>
                                                                            <td data-label="Upload Type">
                                                                                {type}
                                                                            </td>
                                                                            <td data-label="Subtasks">
                                                                                {this.renderArrayTd(child)}
                                                                            </td>
                                                                            <td data-label="Upload Date">
                                                                                {moment(dateAdded).format("MMMM DD, YYYY")}
                                                                            </td>
                                                                            <td data-label="Action">
                                                                                <a
                                                                                    href="javascript:void(0);"
                                                                                    onClick={(e) => this.deleteDocument({ id, name, type })}
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
                                                    ((documentList).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
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
                <DeleteModal
                    id="delete-document"
                    type={'task document'}
                    type_value={documentValue}
                    delete_function={this.confirmDeleteDocument}
                />
            </div >
        )
    }
}