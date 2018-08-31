import React from "react";
import { showToast } from '../../globalFunction';
import { HeaderButtonContainer, DropDown } from "../../globalComponents";

import { connect } from "react-redux"
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
        role: store.role,
        workstream: store.workstream,
        usersTeam: store.usersTeam
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        let { socket } = this.props;
        $(".form-container").validator();
        socket.emit("GET_USER_LIST", {});
        socket.emit("GET_ROLE_LIST", {});
        socket.emit("GET_TEAM_LIST", {});
        socket.emit("GET_PROJECT_LIST", {});
        socket.emit("GET_WORKSTREAM_LIST", {});
        socket.emit("GET_USERS_TEAM", {});
    }

    handleChange(e) {
        let { socket, dispatch, loggedUser } = this.props
        let tempData = Object.assign({}, loggedUser.data)
        tempData[e.target.name] = e.target.value;
        dispatch({ type: "SET_LOGGED_USER_DATA", data: tempData })
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

        socket.emit("SAVE_OR_UPDATE_USER", { data: loggedUser.data });
    }

    render() {
        let { project, loggedUser, teams, role, workstream, usersTeam } = this.props;
        let user = loggedUser.data, userRole = "", userTeam = "", userProjects = [], userWorkstream = [], userTeamMembers = [];

        if (typeof user.id != "undefined" && role.List.length > 0) {
            userRole = role.List.filter(e => { return e.id == user.userRole })[0].role
        }

        if (typeof user.id != "undefined" && teams.List.length > 0) {
            const userTeamStack = teams.List.filter(e => { return e.id == JSON.parse(user.team)[0].value })[0];
            const teamMembers = usersTeam.List.filter(e => { return e.teamId == JSON.parse(user.team)[0].value });

            userTeam = userTeamStack.team;
            userTeamMembers = teamMembers;
        }

        if (typeof user.id != "undefined" && project.List.length > 0) {
            project.List.filter(e => {
                if (user.projectIds.indexOf(e.id) > -1) {
                    userProjects.push({ value: e.id, label: e.project })
                }
            })
        }
        if (typeof user.id != "undefined" && workstream.List.length > 0) {
            workstream.List.filter(e => {
                if (user.projectIds.indexOf(e.projectId) > -1) {
                    userWorkstream.push({ value: e.id, label: e.workstream })
                }
            })
        }

        return <div>
            <HeaderButtonContainer withMargin={true}>
                {/* <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        // dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_PROJECT_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li> */}
                <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">My Profile</h3>
                        </div>
                        <div class="panel-body">
                            <form class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Name</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="firstName" value="" class="form-control" placeholder="Name" value={user.firstName} onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Family Name</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="lastName" value="" class="form-control" placeholder="FamilyName" value={user.lastName} onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Email</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="email" name="emailAddress" value="" class="form-control" placeholder="Email" value={user.emailAddress} onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Phone number</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="number" name="phoneNumber" value="" class="form-control" placeholder="Phone number" value={user.phoneNumber != null ? user.phoneNumber : ""} onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Company</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="number" name="company" value="" class="form-control" placeholder="Company" onChange={this.handleChange} disabled />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Position</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="position" value="" class="form-control" placeholder="Position"
                                            value={userRole}
                                            disabled
                                            onChange={this.handleChange}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                            <hr />
                            <form class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Projects</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={project.List.map(e => { return { id: e.id, name: e.project } })}
                                            selected={userProjects}
                                            multiple={true}
                                            // onChange={(e)=>this.setDropDown("typeId",e.value)} 
                                            disabled />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Workstream</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={workstream.List.map(e => { return { id: e.id, name: e.workstream } })}
                                            selected={userWorkstream}
                                            multiple={true}
                                            // onChange={(e)=>this.setDropDown("typeId",e.value)} 
                                            disabled />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Teams</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="position" value="" class="form-control" placeholder="Position"
                                            value={userTeam}
                                            disabled
                                            onChange={{}}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team Members</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={userTeamMembers.map(e => { return { id: e.id, name: e.users_firstName + ' ' + e.users_lastName } })}
                                            selected={userTeamMembers.map(e => { return { value: e.id, label: e.users_firstName + ' ' + e.users_lastName } })}
                                            multiple={true}
                                            disabled
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