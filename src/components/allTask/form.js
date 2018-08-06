import React from "react"

import { showToast, setDatePicker, displayDate } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"
import Tooltip from "react-tooltip";
import { connect } from "react-redux"
import moment from 'moment'
import MembersForm from "../global/members/membersForm";

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        status: store.status,
        workstream: store.workstream,
        members: store.members,
        teams: store.teams,
        users: store.users
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
    }

    componentDidMount() {
        let { task } = this.props
        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");
        if (typeof task.Selected.id != 'undefined') {
            this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
        }
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

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
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
        let { dispatch, task, status, workstream, users, members, teams } = this.props;
        let statusList = [], typeList = [];
        let workstreamList = workstream.List.map((e, i) => { return { id: e.id, name: e.workstream } });
        status.List.map((e, i) => { if (e.linkType == "task") { statusList.push({ id: e.id, name: e.status }) } });

        let userList = users.List.map((e, i) => { return { id: e.id, name: e.firstName + ' ' + e.lastName } });

        let userMemberList = _(members.List)
            .filter((member) => { return member.usersType == 'users' })
            .map((member) => {
                let returnObject = member;
                let userMember = (users.List).filter((o) => { return o.id == member.userTypeLinkId });
                return { ...member, 'user': userMember[0] };
            })
            .value();

        let teamMemberList = _(members.List)
            .filter((member) => { return member.usersType == 'team' })
            .map((member) => {
                let returnObject = member;
                let teamMember = (teams.List).filter((o) => { return o.id == member.userTypeLinkId });
                return { ...member, 'team': teamMember[0] };
            })
            .value();

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
                            <form class="form-horizontal form-container">
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
                                {
                                    (typeof task.Selected.id != 'undefined') && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label pt0">Members</label>
                                        <div class="col-md-7 col-xs-12">
                                            <a href="#" type="button" data-toggle="modal" data-target="#modal">
                                                Add Members
                                            </a>
                                        </div>
                                    </div>
                                }
                            </form>
                            {
                                (typeof task.Selected.id != 'undefined') && <div class="row pd20">
                                    <h3>Teams</h3>
                                    <table id="dataTable" class="table responsive-table mt30">
                                        <tbody>
                                            <tr>
                                                <th>Team Name</th>
                                                <th></th>
                                            </tr>
                                            {
                                                (teamMemberList.length == 0) &&
                                                <tr>
                                                    <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                                                </tr>
                                            }
                                            {
                                                teamMemberList.map((data, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td>{data.team.team}</td>
                                                            <td class="text-center">
                                                                <a href="javascript:void(0);" data-tip="DELETE"
                                                                    onClick={e => this.deleteData({ id: data.id, type: 'team' })}
                                                                    class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                                    <span class="glyphicon glyphicon-trash"></span></a>
                                                                <Tooltip />
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            }

                            {
                                (typeof task.Selected.id != 'undefined') && <div class="row pd20">
                                    <h3>Members</h3>
                                    <table id="dataTable" class="table responsive-table mt30">
                                        <tbody>
                                            <tr>
                                                <th>Member Name</th>
                                                <th>Type</th>
                                                <th>Role</th>
                                                <th></th>
                                            </tr>
                                            {
                                                (userMemberList.length == 0) &&
                                                <tr>
                                                    <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                                                </tr>
                                            }
                                            {
                                                userMemberList.map((data, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td>{data.user.firstName + ' ' + data.user.lastName}</td>
                                                            <td>{data.user.userType}</td>
                                                            <td>{((typeof data.user.role != 'undefined' && data.user.role).length > 0) ? data.user.role[0].role_role : ''}</td>
                                                            <td class="text-center">
                                                                <a href="javascript:void(0);" data-tip="DELETE"
                                                                    onClick={e => this.deleteData({ id: data.id, type: 'team' })}
                                                                    class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                                    <span class="glyphicon glyphicon-trash"></span></a>
                                                                <Tooltip />
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            }

                        </div>
                    </div>
                </div>
            </div>
            <div class="modal fade" id="modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" id="myModalLabel">Add Members</h4>
                        </div>
                        <div class="modal-body">
                            <MembersForm
                                type={
                                    {
                                        data: task,
                                        label: 'task'
                                    }
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}