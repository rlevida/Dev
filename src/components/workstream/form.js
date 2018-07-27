import React from "react"
import Tooltip from "react-tooltip";
import { showToast } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import MembersForm from "../global/members/membersForm";
import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        users: store.users,
        status: store.status,
        members: store.members,
        teams: store.teams,
        type: store.type
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.deleteData = this.deleteData.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
        let { workstream } = this.props

        if (typeof workstream.Selected.id != 'undefined') {
            this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: workstream.Selected.id, linkType: 'workstream' } });
        }
    }

    handleChange(e) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, workstream } = this.props

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
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { ...workstream.Selected, projectId: project, numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0 } });
    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    setDropDown(name, value) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { dispatch, workstream, users, status, type, members, teams } = this.props
        let statusList = [], typeList = [], userList = [];

        status.List.map((e, i) => { if (e.linkType == "workstream") { statusList.push({ id: e.id, name: e.status }) } })
        type.List.map((e, i) => { if (e.linkType == "workstream") { typeList.push({ id: e.id, name: e.type }) } })
        userList = users.List.map((e, i) => { return { id: e.id, name: e.firstName + ' ' + e.lastName } });

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
                        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
                        dispatch({ type: "SET_MEMBERS_LIST", list: [] });
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
                            <h3 class="panel-title">Workstream {(workstream.Selected.id) ? " > Edit > ID: " + workstream.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Status</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={statusList}
                                            selected={(typeof workstream.Selected.statusId == "undefined") ? "" : workstream.Selected.statusId}
                                            onChange={(e) => this.setDropDown("statusId", e.value)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Workstream *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="workstream" required value={(typeof workstream.Selected.workstream == "undefined") ? "" : workstream.Selected.workstream} class="form-control" placeholder="Workstream" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Type</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={false}
                                            options={typeList}
                                            selected={(typeof workstream.Selected.typeId == "undefined") ? "" : workstream.Selected.typeId}
                                            onChange={(e) => {
                                                this.setDropDown("typeId", e.value);
                                            }} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                {
                                    (typeof workstream.Selected.typeId != "undefined" && workstream.Selected.typeId == 5) && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Number of Hours</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="number" name="numberOfHours" required value={(typeof workstream.Selected.numberOfHours == "undefined") ? "" : workstream.Selected.numberOfHours} class="form-control" placeholder="Number of Hours" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Project Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="projectName" required value={(typeof workstream.Selected.projectName == "undefined") ? "" : workstream.Selected.projectName} class="form-control" placeholder="Project Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Project Description</label>
                                    <div class="col-md-7 col-xs-12">
                                        <textarea name="projectDescription" value={(typeof workstream.Selected.projectDescription == "undefined") ? "" : workstream.Selected.projectDescription} class="form-control" placeholder="Project Description" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                {
                                    (typeof workstream.Selected.id != 'undefined') && <div class="form-group">
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
                                (typeof workstream.Selected.id != 'undefined') && <div class="row pd20">
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
                                (typeof workstream.Selected.id != 'undefined') && <div class="row pd20">
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
                                        data: workstream,
                                        label: 'workstream'
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