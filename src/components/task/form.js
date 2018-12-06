import React from "react";
import { connect } from "react-redux";
import moment from 'moment';
import _ from "lodash";
import parallel from 'async/parallel';

import { showToast, setDatePicker, getData, displayDate, putData, postData, deleteData } from '../../globalFunction';
import { HeaderButtonContainer, Loading, DropDown } from "../../globalComponents";

import Checklist from "./checklist";
import TaskDependency from "./taskDependency";
import Reminder from "./reminder";


@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        taskDependency: store.taskDependency,
        status: store.status,
        workstream: store.workstream,
        checklist: store.checklist,
        members: store.members,
        teams: store.teams,
        loggedUser: store.loggedUser,
        global: store.global
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
        this.deleteData = this.deleteData.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.generateDueDate = this.generateDueDate.bind(this)
        this.deleteChecklist = this.deleteChecklist.bind(this)
        this.deleteTaskDependency = this.deleteTaskDependency.bind(this);
    }

    componentDidMount() {
        let { task, dispatch, project } = { ...this.props };

        if ((task.SelectedId).length > 0) {
            parallel({
                task: (parallelCallback) => {
                    getData(`/api/task/detail/${task.SelectedId[0]}`, {}, (c) => {
                        if (c.status == 200) {
                            dispatch({ type: "SET_CHECKLIST", list: c.data.checklist });
                            dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
                            getData(`/api/member?linkId=${project}&linkType=project&&page=1&isDeleted=0&taskId=${c.data.id}&workstreamId=${c.data.workstream.id}&isDeleted=0`, {}, (d) => {
                                dispatch({ type: 'SET_MEMBERS_LIST', list: d.data.result, count: d.data.count })
                            })
                        } else {
                            parallelCallback("Error retrieving task. Please try again later.");
                        }
                        parallelCallback(null);
                    });
                },
                taskDependency: (parallelCallback) => {
                    getData(`/api/taskDependency?includes=task&taskId=${task.SelectedId[0]}`, {}, (c) => {
                        dispatch({ type: "SET_TASK_DEPENDENCY_LIST", List: c.data })
                        parallelCallback(null, "")
                    })
                }
            }, (error, result) => {
                if (error != null) {
                    showToast("success", "Error retrieving task. Please try again later.");
                } else {
                    dispatch({ type: "SET_TASK_LOADING" });
                }
            });
        } else {
            dispatch({ type: "SET_TASK_LOADING" });
        }
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "startDate", new Date(2019, 3, 20));
        setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
    }

    handleDate(e) {
        const { dispatch, task } = this.props;
        const selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY MMM DD') : '';
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

    generateDueDate(selected) {
        let { dispatch } = this.props;

        if (
            typeof selected.periodType != "undefined"
            && typeof selected.startDate != "undefined"
            && selected.startDate != ""
            && (selected.periodType != "" && selected.periodType != null)
        ) {
            const Selected = Object.assign({}, selected);
            const nextDueDate = moment(selected.startDate).add(selected.periodType, _.toNumber(selected.period)).format('YYYY-MM-DD HH:mm:ss');

            Selected['dueDate'] = nextDueDate;
            dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
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

    handleChange(e) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value;

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });

    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    updateActiveStatus() {
        const { task, loggedUser, dispatch } = this.props;
        const status = "For Approval";

        putData(`/api/task/status/${task.Selected.id}`, { userId: loggedUser.data.id, periodTask: task.Selected.periodTask, periodic: task.Selected.periodic, id: task.Selected.id, status: status }, (c) => {
            const selectedTask = _.filter(c.data, (dataObj) => { return dataObj.id == task.Selected.id });

            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: selectedTask[0] });
                showToast("success", "Task successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    handleSubmit(e) {
        let { task, dispatch, loggedUser } = this.props;
        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.");
        } else if (typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1 && (typeof task.Selected.dueDate == "undefined" || task.Selected.dueDate == "")) {
            showToast("error", "Due date is required for a periodic task.");
        } else {
            const submitData = {
                ...task.Selected,
                userId: loggedUser.data.id,
                projectId: project,
                period: (typeof task.Selected.period != "undefined" && task.Selected.period != "" && task.Selected.period != null) ? _.toNumber(task.Selected.period) : 0,
                periodInstance: (typeof task.Selected.periodic != "undefined" && task.Selected.periodic == 1) ? 3 : 0,
                startDate: (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "" && task.Selected.startDate != null) ? moment(task.Selected.startDate).format('YYYY-MM-DD HH:mm:ss') : null,
                dueDate: (typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "" && task.Selected.dueDate != null) ? moment(task.Selected.dueDate).format('YYYY-MM-DD HH:mm:ss') : null
            };

            dispatch({ type: "SET_TASK_LOADING", Loading: "SUBMITTING" });
            if (typeof task.Selected.id != "undefined") {
                putData(`/api/task/${task.Selected.id}`, submitData, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data });
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                        showToast("success", "Task successfully updated.");
                    } else {
                        showToast("error", "Something went wrong please try again later.");
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            } else {
                postData(`/api/task`, submitData, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data });
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                        showToast("success", "Task successfully updated.");
                    } else {
                        showToast("error", "Something went wrong please try again later.");
                    }
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                });
            }

        }
    }

    setDropDown(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "dependency_type" && value == "") {
            Selected["task_dependency"] = [];
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })

        if (name == "workstreamId") {
            this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "taskList", filter: { "|||and|||": [{ name: "workstreamId", value: value }, { name: "id", value: task.Selected.id, condition: " != " }] } })
        }

    }

    setDropDownMultiple(name, values) {
        let { task, dispatch } = this.props;
        let Selected = Object.assign({}, task.Selected);

        Selected[name] = values;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    deleteChecklist(id) {
        const { task, dispatch } = this.props;

        deleteData(`/api/checklist/${id}?taskId=${task.Selected.id}`, {}, (c) => {
            dispatch({ type: "DELETE_CHECKLIST", data: { id } });
            showToast("success", "Item successfully deleted.");
        });
    }

    deleteTaskDependency(id) {
        const { dispatch, loggedUser } = this.props;

        deleteData(`/api/taskDependency/${id}?userId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "DELETE_TASK_DEPENDENCY", id });
            showToast("success", "Task Dependency successfully deleted.");
        });
    }

    render() {
        const { dispatch, task, loggedUser, checklist, global, taskDependency } = this.props;
        const workstreamList = (typeof global.SelectList.workstreamList != "undefined") ? _.map(global.SelectList.workstreamList, (workstreamObj) => { return { id: workstreamObj.id, name: workstreamObj.workstream } }) : [];
        const allowEdit = (loggedUser.data.userRole == 5 || loggedUser.data.userRole == 6) && (loggedUser.data.userType == "External") ? false : true;
        const taskList = _(task.List)
            .map((taskListObj) => { return { id: taskListObj.id, name: taskListObj.task } })
            .filter((taskListObj) => { return taskListObj.id != task.Selected.id })
            .value();
        const projectUserList = (typeof global.SelectList.projectMemberList != "undefined") ? _.map(global.SelectList.projectMemberList, (projectMemberObj) => { return { id: projectMemberObj.id, name: projectMemberObj.firstName + " " + projectMemberObj.lastName } }) : [];
        const canAssignDependency = (typeof task.Selected.workstream != "undefined") ?
            (
                (loggedUser.data.userRole < 3) ||
                (_.findIndex(task.Selected.workstream.project.project_members, (memObj) => { return memObj.user.id == loggedUser.data.id && (memObj.memberType == "project manager" || memObj.memberType == "responsible") }) >= 0)
            )
            : true;

        const preceedingTask = _(taskDependency.List)
            .filter((o) => {
                return o.dependencyType == "Preceded by"
            })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();

        const succedingTask = _(taskDependency.List)
            .filter((o) => { return o.dependencyType == "Succeeding" })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info"
                        style={{
                            marginRight: "2px",
                            pointerEvents: (task.Loading == "SUBMITTING") ? "none" : ""
                        }}
                        onClick={(e) => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                        }} >
                        <span>Back</span>
                    </li>
                    {
                        (typeof task.Selected.action == 'undefined' || task.Selected.action != 'view') && <li class="btn btn-info"
                            onClick={this.handleSubmit}
                            style={{
                                pointerEvents: (task.Loading == "SUBMITTING") ? "none" : ""
                            }}
                        >
                            <span>{(task.Loading == "SUBMITTING") ? "Saving..." : "Save"}</span>
                        </li>
                    }

                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">{`Task ${(task.SelectedId).length > 0 ? ` > Edit > ${task.SelectedId[0]}` : `> Add`}`}</h3>
                            </div>
                            <div class="panel-body">
                                {
                                    (task.Loading == "RETRIEVING") && <Loading />
                                }
                                {
                                    (task.Loading != "RETRIEVING") &&
                                    <div>
                                        <form
                                            onSubmit={this.handleSubmit}
                                            class="form-horizontal form-container"
                                            style={{ pointerEvents: (typeof task.Selected.action != 'undefined' && task.Selected.action == 'view') ? 'none' : 'auto' }}
                                        >
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Active?</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="checkbox"
                                                        style={{ width: "15px", marginTop: "10px" }}
                                                        checked={task.Selected.isActive ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("isActive", (task.Selected.isActive) ? 0 : 1) }}
                                                    />
                                                </div>
                                            </div>
                                            {
                                                (task.FormAction == "") &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label pt0">Status</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <span>{(task.Selected.status) ? task.Selected.status : "In Progress"}</span>
                                                        {
                                                            (task.Selected.status != "Completed" && typeof task.Selected.id != "undefined" && task.Selected.approvalRequired == 1) &&
                                                            <div class="mt5">
                                                                <a href="javascript:void(0)" class="btn btn-success" onClick={this.updateActiveStatus}>Approve</a>
                                                            </div>
                                                        }
                                                    </div>
                                                </div>
                                            }
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Workstream *</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown multiple={false}
                                                        required={true}
                                                        options={workstreamList}
                                                        selected={(typeof task.Selected.workstreamId == "undefined") ? "" : task.Selected.workstreamId}
                                                        onChange={(e) => this.setDropDown("workstreamId", e.value)}
                                                        disabled={!allowEdit}
                                                    />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Task Name *</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="text" name="task" required value={(typeof task.Selected.task == "undefined") ? "" : task.Selected.task} class="form-control" placeholder="Task Name" onChange={this.handleChange} disabled={!allowEdit} />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Description</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <textarea name="description" value={(typeof task.Selected.description == "undefined" || task.Selected.description == null) ? "" : task.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Periodic?</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="checkbox"
                                                        style={{ width: "15px", marginTop: "10px" }}
                                                        checked={task.Selected.periodic ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("periodic", (task.Selected.periodic) ? 0 : 1) }}
                                                    />
                                                </div>
                                            </div>
                                            {
                                                (task.Selected.periodic == 1) && <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Every *</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <input
                                                            type="number"
                                                            name="period"
                                                            required={task.Selected.periodic == 1}
                                                            value={(typeof task.Selected.period == "undefined" || task.Selected.period == "") ? 1 : task.Selected.period}
                                                            class="form-control" placeholder="Period" onChange={(e) => {
                                                                if (((e.target.value).length <= 4 && _.isNumber(_.toNumber(e.target.value)) && e.target.value > 0) || e.target.value == "") {
                                                                    this.handleChange(e);
                                                                }
                                                            }}
                                                            disabled={!allowEdit}
                                                        />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            {
                                                (task.Selected.periodic == 1) && <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Period Type *</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <DropDown multiple={false}
                                                            required={(task.Selected.periodic == 1)}
                                                            options={_.map(['Year', 'Month', 'Week', 'Day'], (o) => { return { id: (o + 's').toLowerCase(), name: o } })}
                                                            selected={(typeof task.Selected.periodType == "undefined") ? "" : task.Selected.periodType}
                                                            onChange={(e) => this.setDropDown("periodType", e.value)}
                                                            disabled={!allowEdit}
                                                        />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Start Date</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <div class="input-group date">
                                                        <input type="text"
                                                            class="form-control datepicker"
                                                            style={{ backgroundColor: "#eee" }}
                                                            id="startDate"
                                                            name="startDate"
                                                            value={((typeof task.Selected.startDate != "undefined" && task.Selected.startDate != null) && task.Selected.startDate != '') ? displayDate(task.Selected.startDate) : ""}
                                                            onChange={() => { }}
                                                            required={task.Selected.periodic == 1}
                                                            disabled={!allowEdit}
                                                        />
                                                        <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                                        </span>
                                                    </div>

                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Due Date</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <div class="input-group date">
                                                        <input type="text"
                                                            class="form-control datepicker"
                                                            style={{ backgroundColor: "#eee" }}
                                                            id="dueDate"
                                                            name="dueDate"
                                                            value={((typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != null) && task.Selected.dueDate != '') ? displayDate(task.Selected.dueDate) : ""}
                                                            onChange={() => { }}
                                                            required={task.Selected.periodic == 1}
                                                            disabled={!allowEdit}
                                                        />
                                                        <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="help-block with-errors"></div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label pt0">Assigned</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown multiple={false}
                                                        required={false}
                                                        options={_.orderBy(projectUserList, ["name"], ["desc"])}
                                                        selected={(typeof task.Selected.assignedTo == "undefined") ? "" : task.Selected.assignedTo}
                                                        onChange={(e) => {
                                                            this.setDropDown("assignedTo", (e == null) ? "" : e.value);
                                                        }}
                                                        disabled={!allowEdit}
                                                        isClearable={(projectUserList.length > 0)}
                                                    />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Approval Required?</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="checkbox"
                                                        style={{ width: "15px", marginTop: "10px" }}
                                                        checked={task.Selected.approvalRequired ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("approvalRequired", (task.Selected.approvalRequired) ? 0 : 1) }}
                                                    />
                                                </div>
                                            </div>
                                            {
                                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label pt0">Reminder</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <a href="#" type="button" data-toggle="modal" data-target="#reminderModal">
                                                            Edit Reminder
                                                    </a>
                                                    </div>
                                                </div>
                                            }
                                            {
                                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") && <div class="form-group" style={{ marginTop: 25 }}>
                                                    <label class="col-md-3 col-xs-12 control-label pt0">Task Dependencies</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <a href="#" type="button" data-toggle="modal" data-target="#taskDependencyModal">
                                                            Add Task Dependency
                                                    </a>
                                                    </div>
                                                </div>
                                            }
                                            <div class="col-md-7 col-md-offset-3 col-sm-12 mb10">
                                                {
                                                    (preceedingTask.length > 0) && <div>
                                                        <h5 class="mt10">Preceded by</h5>
                                                        <div class="pdl15">
                                                            <table class="table responsive-table m0">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Task</th>
                                                                        <th>Description</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        _.map(preceedingTask, (succTask, index) => {
                                                                            return (
                                                                                <tr key={index}>
                                                                                    <td class="text-left">{succTask.task.task}</td>
                                                                                    <td class="description-td text-left">{succTask.task.description}</td>
                                                                                    <td style={{ maxWidth: 15 }}>
                                                                                        <a class="btn btn-danger"
                                                                                            onClick={() => this.deleteTaskDependency(succTask.id)}
                                                                                        >
                                                                                            <span class="glyphicon glyphicon-trash"></span>
                                                                                        </a>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })
                                                                    }
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                }
                                                {
                                                    (succedingTask.length > 0) && <div class="mb20">
                                                        <h5 class="mt10">Succeeding</h5>
                                                        <div class="pdl15">
                                                            <table class="table responsive-table m0">
                                                                <tbody>
                                                                    <tr>
                                                                        <th>Task</th>
                                                                        <th>Description</th>
                                                                        <th></th>
                                                                    </tr>
                                                                    {
                                                                        _.map(succedingTask, (succTask, index) => {
                                                                            return (
                                                                                <tr key={index}>
                                                                                    <td class="text-left">{succTask.task.task}</td>
                                                                                    <td class="description-td text-left">{succTask.task.description}</td>
                                                                                    <td style={{ maxWidth: 15 }}>
                                                                                        <a class="btn btn-danger"
                                                                                            onClick={() => this.deleteTaskDependency(succTask.id)}
                                                                                        >
                                                                                            <span class="glyphicon glyphicon-trash"></span>
                                                                                        </a>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })
                                                                    }
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                            {
                                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") && <div class="form-group" style={{ marginTop: 25 }}>
                                                    <label class="col-md-3 col-xs-12 control-label pt0">Checklist</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <a href="#" type="button" data-toggle="modal" data-target="#checklistModal">
                                                            Add Checklist
                                                </a>
                                                    </div>
                                                </div>
                                            }
                                            {
                                                (typeof task.Selected.id != "undefined" && task.Selected.id != "") && <div class="row">
                                                    <div id="checklist">
                                                        {
                                                            _.map(checklist.List, (checklistObj, index) => {
                                                                return (
                                                                    <div class="col-md-7 col-md-offset-3 col-sm-12 mb10" key={index}>
                                                                        <div class="wrapper">
                                                                            <p>{checklistObj.description}</p>
                                                                            <div id="checklist-action-wrapper">
                                                                                {
                                                                                    _.map(checklistObj.types, (o, index) => {
                                                                                        return (
                                                                                            <p key={index}><span class="label label-success">{o.value}</span></p>
                                                                                        )
                                                                                    })
                                                                                }
                                                                                {
                                                                                    (checklistObj.isDocument == 1) && <span class="label label-success">Document</span>
                                                                                }
                                                                                <p style={{ marginTop: 5, fontSize: 10 }}>
                                                                                    <span>By : {checklistObj.user.firstName + ' ' + checklistObj.user.lastName + ' - ' + moment(checklistObj.dateAdded).format("MMM DD, YYYY")}</span>
                                                                                </p>
                                                                                <div class="checklist-actions">
                                                                                    <a class="btn btn-danger"
                                                                                        onClick={() => this.deleteChecklist(checklistObj.id)}
                                                                                    >
                                                                                        <span class="glyphicon glyphicon-trash"></span>
                                                                                    </a>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            }
                                        </form>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="checklistModal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                    <div class="modal-dialog modal-md" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                <h4 class="modal-title" id="myModalLabel">Add Checklist</h4>
                            </div>
                            <div class="modal-body">
                                <Checklist />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal fade" id="taskDependencyModal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                    <div class="modal-dialog modal-md" role="taskDependency">
                        <div class="modal-content">
                            <div class="modal-header">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                <h4 class="modal-title" id="myModalLabel">Add Task Dependencies</h4>
                            </div>
                            <div class="modal-body">
                                <TaskDependency />
                            </div>
                        </div>
                    </div>
                </div>
                {
                    (typeof task.Selected.id !== 'undefined') &&
                    <div class="modal fade" id="reminderModal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                        <div class="modal-dialog modal-lg" role="reminderModal">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                    <h4 class="modal-title" id="myModalLabel">Reminder</h4>
                                </div>
                                <div class="modal-body">
                                    <Reminder />
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div >
        )
    }
}