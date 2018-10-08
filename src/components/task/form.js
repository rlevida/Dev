import React from "react";
import { connect } from "react-redux";
import moment from 'moment';
import _ from "lodash";

import { showToast, setDatePicker, displayDate } from '../../globalFunction';
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import Checklist from "./checklist";


@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        status: store.status,
        workstream: store.workstream,
        checklist: store.checklist,
        members: store.members,
        teams: store.teams,
        users: store.users,
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
    }

    componentDidMount() {
        let { task, socket } = { ...this.props };

        $(".form-container").validator();

        setDatePicker(this.handleDate, "dueDate");
        setDatePicker(this.handleDate, "startDate");

        if (typeof task.Selected.id != 'undefined') {
            socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
            socket.emit("GET_CHECK_LIST", { filter: { taskId: task.Selected.id } });
        }

        if (typeof task.Selected.workstreamId != "undefined") {
            socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "taskList", filter: { "|||and|||": [{ name: "workstreamId", value: task.Selected.workstreamId }, { name: "id", value: task.Selected.id, condition: " != " }] } })
        }
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
    }

    handleDate(e) {
        let { dispatch, task } = this.props;
        let Selected = Object.assign({}, { ...task.Selected })
        let selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY MMM DD') : '';

        if ((typeof Selected.startDate != "undefined" || typeof Selected.dueDate != "undefined") && (Selected.startDate != "" || Selected.dueDate != "")) {
            let startDate = moment(Selected.startDate);
            let dueDate = moment(Selected.dueDate);
            let comparison = (e.target.name == "startDate") ? moment(dueDate).diff(e.target.value, 'days') : moment(e.target.value).diff(startDate, 'days');

            if (comparison < 0) {
                showToast("error", "Due Date must be after the Start Date.");
                Selected[e.target.name] = undefined;
            } else {
                Selected[e.target.name] = selectedDate;
            }
        } else if (e.target.name == "dueDate" && e.target.value != "" && (typeof Selected.startDate == "undefined" || Selected.startDate == "")) {
            showToast("error", "Pleas fill up the Start Date first.");
        } else {
            Selected[e.target.name] = selectedDate;
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });

        if (e.target.name == "startDate") {
            this.generateDueDate(Selected);
        }
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
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "periodic") {
            Selected = { ...Selected, dueDate: '', endDate: '', taskDueDate: '', periodType: '', period: (value == 1) ? 1 : 0, periodInstance: (value == 1) ? 1 : 0 }
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value;

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });

        if ((e.target.name == "period")
            && (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "")
        ) {
            this.generateDueDate(Selected)
        }

    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    updateActiveStatus() {
        let { task, socket } = this.props;
        let status = "Completed"
        if (task.Selected.task_id && task.Selected.task_status != "Completed") {
            status = "For Approval"
        }

        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
    }

    handleSubmit(e) {
        let { socket, task, dispatch } = this.props;
        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.");
        } else if (
            task.Selected.periodic == 1 &&
            (typeof task.Selected.startDate == "undefined" || task.Selected.startDate == "")
        ) {
            showToast("error", "Start date is required when task is periodic.");
        } else {
            const submitData = {
                ...task.Selected,
                projectId: project,
                period: _.toNumber(task.Selected.period),
                periodInstance: _.toNumber(task.Selected.periodInstance),
                startDate: (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "" && task.Selected.startDate != null) ? moment(task.Selected.startDate).format('YYYY-MM-DD 00:00:00') : null,
                dueDate: (typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "" && task.Selected.startDate != null) ? moment(task.Selected.dueDate).format('YYYY-MM-DD 00:00:00') : null
            };

            socket.emit("SAVE_OR_UPDATE_TASK", { data: submitData });
        }
    }

    setDropDown(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "dependencyType" && value == "") {
            Selected["linkTaskIds"] = [];
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })

        if (name == "workstreamId") {
            this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "taskList", filter: { "|||and|||": [{ name: "workstreamId", value: value }, { name: "id", value: task.Selected.id, condition: " != " }] } })
        }

        if ((name == "periodType")
            && (typeof task.Selected.startDate != "undefined" && task.Selected.startDate != "")
        ) {
            this.generateDueDate(Selected)
        }

    }

    setDropDownMultiple(name, values) {
        let { task, dispatch } = this.props;
        let Selected = Object.assign({}, task.Selected);

        Selected[name] = values;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    render() {
        let { dispatch, task, status, workstream, global, loggedUser, checklist, socket } = this.props;
        let statusList = [], typeList = [], taskList = [], projectUserList = [];
        let workstreamList = workstream.List.map((e, i) => { return { id: e.id, name: e.workstream } });
        let allowEdit = (loggedUser.data.userRole == 5 || loggedUser.data.userRole == 6) && (loggedUser.data.userType == "External") ? false : true;
        let canAssignDependency = (
            loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 ||
            _.findIndex(task.Selected.project_manager, (o) => { return o == loggedUser.data.id }) >= 0 ||
            _.findIndex(task.Selected.workstream_responsible, (o) => { return o == loggedUser.data.id }) >= 0
        );

        status.List.map((e, i) => { if (e.linkType == "task") { statusList.push({ id: e.id, name: e.status }) } });

        if (typeof this.props.global.SelectList.taskList != "undefined") {
            this.props.global.SelectList["taskList"].map((e) => {
                taskList.push({ id: e.id, name: e.task })
            })
        }

        if (typeof global.SelectList.ProjectMemberList != "undefined") {
            global.SelectList.ProjectMemberList.map((e, i) => { projectUserList.push({ id: e.id, name: e.firstName + " " + e.lastName }) })
        }

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" style={{ marginRight: "2px" }}
                        onClick={(e) => {
                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                            dispatch({ type: "SET_TASK_SELECTED", Selected: { isActive: true } });
                        }} >
                        <span>Back</span>
                    </li>
                    {
                        (typeof task.Selected.action == 'undefined' || task.Selected.action != 'view') && <li class="btn btn-info" onClick={this.handleSubmit} >
                            <span>Save</span>
                        </li>
                    }

                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Task {(task.Selected.id) ? " > Edit > ID: " + task.Selected.id : " > Add"}</h3>
                            </div>
                            <div class="panel-body">
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
                                    {(task.FormAction == "") &&
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label"></label>
                                            <div class="col-md-7 col-xs-12">
                                                <span style={{ padding: "10px" }}>{(task.Selected.status) ? task.Selected.status : "In Progress"}</span>
                                                {
                                                    (task.Selected.status == "For Approval" && task.Selected.status == "Completed" && task.Selected.task_id) &&
                                                    <a href="javascript:void(0)" class="btn btn-success" onClick={this.updateActiveStatus}>Approve</a>
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
                                            <textarea name="description" value={(typeof task.Selected.description == "undefined") ? "" : task.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Dependency Type</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown multiple={false}
                                                required={false}
                                                options={_.map(['Preceded by', 'Succeeding'], (o) => { return { id: o, name: o } })}
                                                selected={(typeof task.Selected.dependencyType == "undefined") ? "" : task.Selected.dependencyType}
                                                onChange={(e) => {
                                                    this.setDropDown("dependencyType", (e == null) ? "" : e.value);
                                                }}
                                                disabled={!allowEdit && canAssignDependency == false}
                                                isClearable={true}
                                            />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                    {
                                        (typeof task.Selected.dependencyType != "undefined"
                                            && (task.Selected.dependencyType != "" &&
                                                task.Selected.dependencyType != null)) && <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Dependent Tasks *</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown multiple={true}
                                                    required={typeof task.Selected.dependencyType != "undefined"
                                                        && (task.Selected.dependencyType != "" &&
                                                            task.Selected.dependencyType != null)}
                                                    options={taskList}
                                                    selected={(typeof task.Selected.linkTaskIds == "undefined") ? [] : task.Selected.linkTaskIds}
                                                    onChange={(e) => this.setDropDownMultiple("linkTaskIds", e)}
                                                    disabled={!allowEdit && canAssignDependency == false}
                                                />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                    }
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
                                    {
                                        (task.Selected.periodic == 1 &&
                                            (typeof task.Selected.id == "undefined" || task.Selected.id == "")) && <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Period Instance</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input
                                                    type="number"
                                                    name="periodInstance"
                                                    required={task.Selected.periodInstance == 1}
                                                    value={(typeof task.Selected.periodInstance == "undefined" || task.Selected.periodInstance == "") ? 1 : task.Selected.periodInstance}
                                                    class="form-control" placeholder="Period Instance" onChange={(e) => {
                                                        if (((e.target.value).length <= 4 && _.isNumber(_.toNumber(e.target.value)) && e.target.value >= 1) || e.target.value == "") {
                                                            this.handleChange(e);
                                                        }
                                                    }}
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
                                    {
                                        (task.Selected.periodic == 1) && <div class="row mb15">
                                            <div class="col-md-3 col-xs-12">
                                                <p style={{ textAlign: 'right', fontColor: '#333', fontWeight: '600' }}>Due Date</p>
                                            </div>
                                            <div class="col-md-7 col-xs-12">
                                                {(typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != "") ? moment(task.Selected.dueDate).format('YYYY MMM DD') : ''}
                                            </div>
                                        </div>
                                    }
                                    {
                                        (typeof task.Selected.periodic == "undefined" || task.Selected.periodic != 1) && <div class="form-group">
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
                                    }
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
                                        (typeof task.Selected.id != "undefined" && task.Selected.id != "") && <div class="form-group" style={{ marginTop: 25 }}>
                                            <label class="col-md-3 col-xs-12 control-label pt0">Checklist</label>
                                            <div class="col-md-7 col-xs-12">
                                                <a href="#" type="button" data-toggle="modal" data-target="#checklistModal">
                                                    Add Checklist
                                                </a>
                                            </div>
                                        </div>
                                    }
                                </form>
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
                                                                        <span>By : {checklistObj.users_firstName + ' ' + checklistObj.users_lastName + ' - ' + moment(checklistObj.dateAdded).format("MMM DD, YYYY")}</span>
                                                                    </p>
                                                                    <div class="checklist-actions">
                                                                        <a class="btn btn-danger"
                                                                            onClick={() => {
                                                                                socket.emit("DELETE_CHECKLIST", { data: checklistObj.id })
                                                                            }}
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
            </div>
        )
    }
}