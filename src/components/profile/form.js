import React from "react";
import { showToast } from '../../globalFunction';
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import { connect } from "react-redux";
import _ from 'lodash';

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
        let user = loggedUser.data, userRole = "", userTeam = [], userProjects = [], userWorkstream = [];
        if (typeof user.id != "undefined" && role.List.length > 0) {
            userRole = role.List.filter(e => { return e.id == user.userRole })[0].role
        }

        if (typeof user.id != "undefined" && teams.List.length > 0) {
            userTeam = JSON.parse(user.team);
        }

        if (typeof user.id != "undefined" && project.List.length > 0) {
            userProjects = _(project.List)
                .filter((e) => {
                    return _.findIndex(user.projectIds, (o) => { return o == e.id }) > -1;
                })
                .value();

            userWorkstream = _(workstream.List)
            .filter((e) => {
                return _.findIndex(user.projectIds, (o) => { return o == e.projectId }) > -1;
            })
            .value();
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
                {/* <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li> */}
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">My Profile</h3>
                        </div>
                        <div class="panel-body">
                            <div class="row pdl20 pdr20 mb20">
                                <div class="col-md-6">
                                    <h4 class="mt20 mb20">Personal Details</h4>
                                    <form style={{ pointerEvents: 'none' }}>
                                        <div class="form-group">
                                            <label for="firstName">First Name:</label>
                                            <input type="text" name="firstName" value="" class="form-control" placeholder="Name" value={user.firstName} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Last Name:</label>
                                            <input type="text" name="lastName" value="" class="form-control" placeholder="FamilyName" value={user.lastName} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Email Address:</label>
                                            <input type="email" name="emailAddress" value="" class="form-control" placeholder="Email" value={user.emailAddress} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Phone Number:</label>
                                            <input type="number" name="phoneNumber" value="" class="form-control" placeholder="Phone number" value={user.phoneNumber != null ? user.phoneNumber : ""} onChange={this.handleChange} />
                                        </div>
                                        {
                                            (user.userType == "External") &&
                                            <div class="form-group">
                                                <label for="company">Company:</label>
                                                <input type="company" name="company" value="" class="form-control" placeholder="Company" value={user.company != null ? user.company : ""} onChange={this.handleChange} />
                                            </div>
                                        }
                                    </form>
                                </div>
                            </div>
                            {
                                (user.userType == 'Internal') && <div class="row pdl20 pdr20 mb20">
                                    <div class="col-md-6">
                                        <h4 class="mt20 mb20">Projects</h4>
                                        <table id="dataTable" class="table responsive-table mt30">
                                            <tbody>
                                                <tr>
                                                    <th class="text-left">Project</th>
                                                    <th class="text-center">Type</th>
                                                </tr>
                                                {
                                                    _.map(userProjects, (data) => {
                                                        return (
                                                            <tr>
                                                                <td class="text-left"><a href={"/project/" + data.id}>{data.project}</a></td>
                                                                <td class="text-center"><span class={(data.type_type == "Client") ? "fa fa-users" : (data.type_type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></span></td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            }
                            <div class="row pdl20 pdr20 mb20">
                                <div class="col-md-6">
                                    <h4 class="mt20 mb20">Workstream</h4>
                                    <table id="dataTable" class="table responsive-table mt30">
                                        <tbody>
                                            <tr>
                                                <th class="text-left">Workstream</th>
                                                <th class="text-center">Type</th>
                                            </tr>
                                            {
                                                _.map(userWorkstream, (data) => {
                                                    return (
                                                        <tr>
                                                            <td class="text-left">{data.workstream}</td>
                                                            <td><span class={data.type_type == "Output based" ? "fa fa-calendar" : "glyphicon glyphicon-time"}></span></td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {
                                (user.userType == 'Internal') && <div class="row pdl20 pdr20 mb20">
                                    <div class="col-md-8">
                                        <h4 class="mt20 mb20">Teams</h4>
                                        <table id="dataTable" class="table responsive-table mt30">
                                            <tbody>
                                                <tr>
                                                    <th class="text-left">Team</th>
                                                    <th class="text-left">Members</th>
                                                </tr>
                                                {
                                                    _.map(userTeam, (team) => {
                                                        let teamMembers = _(usersTeam.List)
                                                            .filter(e => { return e.teamId == team.value })
                                                            .map(e => { return e.users_firstName + ' ' + e.users_lastName })
                                                            .value();

                                                        return (
                                                            <tr>
                                                                <td class="text-left">{team.label}</td>
                                                                <td class="text-left">
                                                                    {
                                                                        (teamMembers).join(", ")
                                                                    }
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
                    </div>
                </div>
            </div>
        </div>
    }
}