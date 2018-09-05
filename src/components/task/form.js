import React from "react"

import { showToast, setDatePicker, displayDate } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"
import { connect } from "react-redux"
import moment from 'moment'

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        status: store.status,
        workstream: store.workstream,
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
    }

    componentDidMount() {
        let { task } = this.props
        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");
        if (typeof task.Selected.id != 'undefined') {
            this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
        }
        if (typeof task.Selected.workstreamId != "undefined") {
            this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "taskList", filter: { "|||and|||": [{ name: "workstreamId", value: task.Selected.workstreamId }, { name: "id", value: task.Selected.id, condition: " != " }] } })
        }
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "dueDate");
    }

    handleDate(e) {
        let { dispatch, task } = this.props;
        let Selected = Object.assign({}, task.Selected)
        let selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY MMM DD') : '';

        Selected[e.target.name] = selectedDate;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected });
    }

    handleCheckbox(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    updateActiveStatus() {
        let { task, socket, dispatch } = this.props;
        let status = "Completed"
        if (task.Selected.task_id && task.Selected.task_status != "Completed") {
            status = "For Approval"
        }

        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
    }

    handleSubmit(e) {
        let { socket, task, dispatch } = this.props

        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });
        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }
        socket.emit("SAVE_OR_UPDATE_TASK", { data: { ...task.Selected, projectId: project, dueDate: moment(task.Selected.dueDate).format('YYYY-MM-DD 00:00:00') } });
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
    }

    setDropDown(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })

        if (name == "workstreamId") {
            this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "taskList", filter: { "|||and|||": [{ name: "workstreamId", value: value }, { name: "id", value: task.Selected.id, condition: " != " }] } })
        }
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { dispatch, task, status, workstream, global, loggedUser } = this.props;
        let statusList = [], typeList = [], taskList = [{ id: "", name: "Select..." }], projectUserList = [];
        let workstreamList = workstream.List.map((e, i) => { return { id: e.id, name: e.workstream } });
        let allowEdit = (loggedUser.data.userRole == 5 || loggedUser.data.userRole == 6) && (loggedUser.data.userType == "External") ? false : true;

        status.List.map((e, i) => { if (e.linkType == "task") { statusList.push({ id: e.id, name: e.status }) } });

        if (typeof this.props.global.SelectList.taskList != "undefined") {
            this.props.global.SelectList["taskList"].map((e) => {
                taskList.push({ id: e.id, name: e.task })
            })
        }
        if (typeof global.SelectList.ProjectMemberList != "undefined") {
            global.SelectList.ProjectMemberList.map((e, i) => { projectUserList.push({ id: e.id, name: e.username + " - " + e.firstName }) })
        }

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
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
                                    <label class="col-md-3 col-xs-12 control-label">Is Active?</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="checkbox"
                                            style={{ width: "15px", marginTop: "10px" }}
                                            checked={task.Selected.isActive ? true : false}
                                            onChange={() => { }}
                                            onClick={(f) => { this.handleCheckbox("isActive", (task.Selected.isActive) ? 0 : 1) }}
                                        />
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label"></label>
                                    <div class="col-md-7 col-xs-12">
                                        <span style={{ padding: "10px" }}>{(task.Selected.status) ? task.Selected.status : "In Progress"}</span>
                                        {task.Selected.status == "For Approval" && task.Selected.task_status == "Completed" && task.Selected.task_id &&
                                            <a href="javascript:void(0)" class="btn btn-success" onClick={this.updateActiveStatus}>Approve</a>
                                        }
                                        {
                                            ((!task.Selected.status || task.Selected.status == "In Progress") && (typeof task.Selected.isActive == 'undefined' || task.Selected.isActive == 1)) && <a href="javascript:void(0)" class="btn btn-success" onClick={this.updateActiveStatus}>Complete</a>
                                        }
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Workstream</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
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
                                    <label class="col-md-3 col-xs-12 control-label">Dependent to task</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={taskList}
                                            selected={(typeof task.Selected.linkTaskId == "undefined") ? "" : task.Selected.linkTaskId}
                                            onChange={(e) => this.setDropDown("linkTaskId", e.value)}
                                            disabled={!allowEdit}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Due Date: </label>
                                    <div class="col-md-7 col-xs-12">
                                        <div class="input-group date">
                                            <input type="text"
                                                class="form-control datepicker"
                                                style={{ backgroundColor: "#eee" }}
                                                id="dueDate"
                                                name="dueDate"
                                                value={(typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate != '') ? displayDate(task.Selected.dueDate) : ""}
                                                onChange={() => { }}
                                                required={false}
                                                disabled={!allowEdit}
                                            />
                                            <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="help-block with-errors"></div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label pt0">Assigned *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={projectUserList}
                                            selected={(typeof task.Selected.assignedTo == "undefined") ? "" : task.Selected.assignedTo}
                                            onChange={(e) => {
                                                this.setDropDown("assignedTo", e.value);
                                            }}
                                            disabled={!allowEdit}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}