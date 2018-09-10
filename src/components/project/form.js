import React from "react";
import moment from 'moment';
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast } from '../../globalFunction';
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import Members from "./members";

import Workstreams from "./workstream";

@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        users: store.users,
        teams: store.teams,
        members: store.members,
        workstream: store.workstream
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        this.deleteData = this.deleteData.bind(this)
        this.renderArrayTd = this.renderArrayTd.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
        if (typeof this.props.project.Selected.id != 'undefined') {
            this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: this.props.project.Selected.id, linkType: 'project' } });
        }
    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", { filter: { id: params.id } })
        }
    }

    handleChange(e) {
        let { socket, dispatch, project } = this.props
        let Selected = Object.assign({}, project.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected })
    }

    handleCheckbox(name, value) {
        let { socket, dispatch, project } = this.props
        let Selected = Object.assign({}, project.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, project, loggedUser } = this.props
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
        if (!project.Selected.id) {
            project.Selected.createdBy = loggedUser.data.id;
        }

        socket.emit("SAVE_OR_UPDATE_PROJECT", { data: project.Selected });
    }

    setDropDown(name, value) {
        let { socket, dispatch, project } = this.props
        let Selected = Object.assign({}, project.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected })

    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    render() {
        let { dispatch, project, loggedUser, members, status, type, users, teams, workstream } = this.props;
        let statusList = [], typeList = [];

        status.List.map((e, i) => { if (e.linkType == "project") { statusList.push({ id: e.id, name: e.status }) } })
        type.List.map((e, i) => {
            if (e.linkType == "project") {
                let dontShowType = false;
                if (e.id == 1 && loggedUser.data.userRole != 1 && loggedUser.data.userRole != 2 && loggedUser.data.userRole != 3) {
                    dontShowType = true;
                }

                if (!dontShowType) {
                    typeList.push({ id: e.id, name: e.type })
                }
            }
        });

        let projectManagerFilter = _.filter(members.List, (o) => { return o.memberType == "project manager" });
        let projectManager = '';

        if (typeof project.Selected.projectManagerId != "undefined") {
            projectManager = project.Selected.projectManagerId;
        } else if (projectManagerFilter.length > 0) {
            projectManager = projectManagerFilter[0].userTypeLinkId;
        }

        //console.log(users)
        let userMemberList = _(members.List)
            .filter((member) => {
                return member.usersType == 'users';
            })
            .map((member) => {
                let returnObject = member;
                let userMember = (users.List).filter((o) => { return o.id == member.userTypeLinkId });
                return { ...member, 'user': userMember[0] };
            })
            .value();

        let teamMemberList = _(members.List)
            .filter((member) => { return member.usersType == 'team' })
            .map((member) => {
                let team = _(teams.List).filter((o) => { return o.id == member.userTypeLinkId }).value();
                let teamMembers = _(users.List).filter((o) => { return _.findIndex(o.team, (e) => { return e.teamId == member.userTypeLinkId }) >= 0 }).value();

                return { ...member, members: teamMembers, team: (team.length > 0) ? team[0] : ''  };
            })
            .value();
        
        let projectManagerUsers = _(users.List)
            .filter((user) => {
                let { role } = { ...user };
                let canBeProjectManager = _.findIndex(role, function (o) { return o.roleId == 2 || o.roleId == 3 || o.roleId == 5; });
                return canBeProjectManager >= 0;
            }).map((user) => {
                return { id: user.id, name: user.firstName + ' ' + user.lastName }
            })
            .orderBy(['name'])
            .value();

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" style={{ marginRight: "2px" }}
                        onClick={(e) => {
                            dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                            dispatch({ type: "SET_PROJECT_SELECTED", Selected: {} });
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
                                <h3 class="panel-title">Project {(project.Selected.id) ? " > Edit > ID: " + project.Selected.id + "" : " > Add"}</h3>
                            </div>
                            <div class="panel-body">
                                {
                                    (_.isEmpty(workstream.Selected)) && <div>
                                        <form class="form-horizontal form-container">
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Active?</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="checkbox"
                                                        style={{ width: "15px", marginTop: "10px" }}
                                                        checked={project.Selected.isActive ? true : false}
                                                        onChange={() => { }}
                                                        onClick={(f) => { this.handleCheckbox("isActive", (project.Selected.isActive) ? 0 : 1) }}
                                                    />
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Created Date</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <span>{(project.Selected.dateAdded) ? moment(project.Selected.dateAdded).format("MMM D YYYY") : ""}</span>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Project *</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="text" name="project" required value={(typeof project.Selected.project == "undefined") ? "" : project.Selected.project} class="form-control" placeholder="Project" onChange={this.handleChange} />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Type *</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown multiple={false}
                                                        required={true}
                                                        options={typeList}
                                                        selected={(typeof project.Selected.typeId == "undefined") ? "" : project.Selected.typeId}
                                                        onChange={(e) => this.setDropDown("typeId", e.value)}
                                                    />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            { (typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Tin No.</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <input type="text" name="tinNo" value={(typeof project.Selected.tinNo == "undefined") ? "" : project.Selected.tinNo} class="form-control" placeholder="Tin No." onChange={this.handleChange} />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            { (typeof project.Selected.typeId == "undefined"  || project.Selected.typeId == 1) &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Company Address</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <input type="text" name="companyAddress" value={(typeof project.Selected.companyAddress == "undefined") ? "" : project.Selected.companyAddress} class="form-control" placeholder="Company Address" onChange={this.handleChange} />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Project Manager</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown multiple={false}
                                                        required={false}
                                                        options={projectManagerUsers}
                                                        isClearable={(projectManagerUsers.length > 0)}
                                                        selected={projectManager}
                                                        onChange={(e) => {
                                                            this.setDropDown("projectManagerId", (e == null) ? "" : e.value);
                                                        }}
                                                    />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                            {
                                                (typeof project.Selected.id != 'undefined' && project.Selected.typeId != "3") && <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label pt0">Members</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <a href="#" type="button" data-toggle="modal" data-target="#projectModal">
                                                            Add Members
                                            </a>
                                                    </div>
                                                </div>
                                            }
                                        </form>
                                        {
                                            (typeof project.Selected.id != 'undefined' && project.Selected.typeId != "3") && <div class="row pd20">
                                                <h3>Teams</h3>
                                                <table id="dataTable" class="table responsive-table mt30">
                                                    <tbody>
                                                        <tr>
                                                            <th class="text-center">Id</th>
                                                            <th class="text-left">Team</th>
                                                            <th class="text-left">Team Leader</th>
                                                            <th class="text-left">Members</th>
                                                            <th class="text-center"></th>
                                                            {/* {
                                                                (teamMemberList.length > 0) && <th></th>
                                                            } */}
                                                        </tr>
                                                        {
                                                            <tr>
                                                                {
                                                                    (teamMemberList.length == 0) && <td style={{ textAlign: "center" }} colSpan={5}>No Record Found!</td>
                                                                }
                                                            </tr>
                                                        }
                                                        {
                                                            teamMemberList.map((data, index) => {
                                                                return (
                                                                    <tr key={index}>
                                                                        <td class="text-center">{(typeof data.team.id != 'undefined') ? data.team.id: ''}</td>
                                                                        <td class="text-left">{(typeof data.team.id != 'undefined') ? data.team.team : ''}</td>
                                                                        <td class="text-left">{(typeof data.team.teamLeaderId != 'undefined') ? data.team.users_username : ''}</td>
                                                                        <td class="text-left">{this.renderArrayTd(_.map(data.members, (el) => { return el.username }))}</td>
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
                                            (typeof project.Selected.id != 'undefined' && project.Selected.typeId != "3") && <div class="row pd20">
                                                <h3>Members</h3>
                                                <table id="dataTable" class="table responsive-table mt30">
                                                    <tbody>
                                                        <tr>
                                                            <th class="text-center">Id</th>
                                                            <th class="text-left">User Id</th>
                                                            <th class="text-left">First Name</th>
                                                            <th class="text-left">Last Name</th>
                                                            <th class="text-left">Email Address</th>
                                                            <th class="text-center">Type</th>
                                                            <th class="text-left">Role/s</th>
                                                            <th class="text-left">Team/s</th>
                                                            <th class="text-center"></th>
                                                        </tr>
                                                        {
                                                            (userMemberList.length == 0) && <tr>
                                                                <td style={{ textAlign: "center" }} colSpan={9}>No Record Found!</td>
                                                            </tr>
                                                        }
                                                        {
                                                            (userMemberList.length > 0) && userMemberList.map((data, index) => {
                                                                return (
                                                                    <tr key={index}>
                                                                        <td class="text-center">{data.user.id}</td>
                                                                        <td class="text-left">{data.user.username}</td>
                                                                        <td class="text-left">{data.user.firstName}</td>
                                                                        <td class="text-left">{data.user.lastName}</td>
                                                                        <td class="text-left">{data.user.emailAddress}</td>
                                                                        <td class="text-center">{data.user.userType}</td>
                                                                        <td class="text-left">{this.renderArrayTd(_.map(data.user.role, (el) => { return el.role_role }))}</td>
                                                                        <td class="text-left">{this.renderArrayTd(_.map(data.user.team, (el) => { return el.team_team }))}</td>
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
                                }
                                {
                                    (typeof project.Selected.id != 'undefined') && <div class="row pd20">
                                        <h3>Workstream</h3>
                                        <Workstreams />
                                    </div>
                                }
                                <div class="modal fade" id="projectModal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
                                    <div class="modal-dialog modal-md" role="document">
                                        <div class="modal-content">
                                            <div class="modal-header">
                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                                                <h4 class="modal-title" id="myModalLabel">Add Members</h4>
                                            </div>
                                            <div class="modal-body">
                                                <Members type={
                                                    {
                                                        data: project,
                                                        label: 'project'
                                                    }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}