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
        workstream: store.workstream
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "dueDate");
    }

    handleDate(e) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)

        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, task } = this.props

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
    }

    setDropDown(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { dispatch, task, status, workstream } = this.props;
        let statusList = [], typeList = [];
        let workstreamList = workstream.List.map((e, i) => { return { id: e.id, name: e.workstream } });
        status.List.map((e, i) => { if (e.linkType == "task") { statusList.push({ id: e.id, name: e.status }) } });

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li>
                <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Task {(task.Selected.id) ? " > Edit > ID: " + task.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Status</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={statusList}
                                            selected={(typeof task.Selected.statusId == "undefined") ? "" : task.Selected.statusId}
                                            onChange={(e) => this.setDropDown("statusId", e.value)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Workstream</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={workstreamList}
                                            selected={(typeof task.Selected.workstreamId == "undefined") ? "" : task.Selected.workstreamId}
                                            onChange={(e) => this.setDropDown("workstreamId", e.value)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Task Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="task" required value={(typeof task.Selected.task == "undefined") ? "" : task.Selected.task} class="form-control" placeholder="Task Name" onChange={this.handleChange} />
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
                                                value={(typeof task.Selected.dueDate != "undefined" && task.Selected.dueDate) ? displayDate(task.Selected.dueDate) : ""}
                                                onChange={() => { }}
                                                required={false}
                                            />
                                            <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="help-block with-errors"></div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}