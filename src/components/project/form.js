import React from "react";
import moment from 'moment';
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, getData, putData, deleteData, postData } from '../../globalFunction';
import { HeaderButtonContainer, DropDown, Loading } from "../../globalComponents";
import Members from "./members";
import parallel from 'async/parallel';
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
        workstream: store.workstream,
        global: store.global
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        this.renderArrayTd = this.renderArrayTd.bind(this)
    }

    componentDidMount() {
        const { dispatch, project } = this.props;
        $(".form-container").validator();

        getData(`/api/project/getProjectMembers?linkId=${project.Selected.id}&linkType=project&usersType=users`, {}, (c) => {
            dispatch({ type: "SET_MEMBERS_LIST", list: c.data });
        });

        getData(`/api/project/getProjectTeams?linkId=${project.Selected.id}&linkType=project&usersType=team`, {}, (c) => {
            dispatch({ type: "SET_TEAM_LIST", list: c.data })
        });

        getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
        });
    }

    deleteMember(value) {
        let { dispatch, members } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            deleteData(`/api/project/deleteProjectMember/${value.id}`, {}, (c) => {
                if (c.status == 200) {
                    if (value.usersType == "users") {
                        dispatch({ type: "REMOVE_DELETED_MEMBERS_LIST", id: c.data })
                    } else {
                        let newMemberList = members.List.filter((e) => { return e.id != c.data })

                        dispatch({ type: "REMOVE_DELETED_TEAM_LIST", id: c.data })
                        dispatch({ type: "SET_MEMBERS_LIST", list: newMemberList })
                    }
                    showToast("success", "Successfully Deleted")
                } else {
                    showToast("error", "Delete failed. Please try again.")
                }
            })
        }
    }

    handleChange(e) {
        const { dispatch, project } = this.props
        let Selected = Object.assign({}, project.Selected)

        this.setState({
            currentProjectManager: Selected.projectManagerId
        });

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
        let { socket, project, loggedUser, dispatch } = this.props
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

            postData(`/api/project`, { ...project.Selected }, (c) => {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data.project })
                dispatch({ type: "SET_MEMBERS_LIST", list: c.data.members })
                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })
                showToast("success", "Successfully Added.")
            })
        } else {
            let dataToSubmit = {
                project: project.Selected.project,
                isActive: project.Selected.isActive,
                typeId: project.Selected.typeId,
                tinNo: project.Selected.tinNo,
                companyAddress: project.Selected.companyAddress,
                classification: project.Selected.classification,
                projectNameCount: project.Selected.projectNameCount,
                projectType: project.Selected.projectType,
                projectManagerId: project.Selected.projectManagerId
            }
            putData(`/api/project/${project.Selected.id}`, dataToSubmit, (c) => {
                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
                showToast("success", "Successfully Updated.")
            })
        }
    }

    setDropDown(name, value) {
        const { dispatch, project, members } = this.props;
        const Selected = Object.assign({}, project.Selected);

        if (name == "projectManagerId" && value != "") {
            if (value != project.ProjectManagerId) {
                let newMemberList = members.List.filter((e) => { return e.user.id != project.ProjectManagerId })
                dispatch({ type: "SET_PROJECT_MANAGER_ID", id: name })
                dispatch({ type: "SET_MEMBERS_LIST", list: newMemberList })
            }
        }
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

    handleReceiveNotifacation(value) {
        let { dispatch, members } = this.props;
        let dataToSubmit = {
            filter: { userTypeLinkId: value.user.id, usersType: 'users' },
            data: { receiveNotification: value.receiveNotification ? 0 : 1 }
        }

        putData(`/api/project/projectMember/${value.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                let dataToUpdate = members.List.filter((e) => { return e.user.id == value.user.id })[0]
                dataToUpdate = { ...dataToUpdate, receiveNotification: value.receiveNotification ? 0 : 1 }
                dispatch({ type: "UPDATE_DATA_MEMBERS_LIST", UpdatedData: dataToUpdate })
                showToast('success', "Successfully Updated.")
            } else {
                showToast('error', "Update failed. Please try again.")
            }
        })
    }

    renderRoles(value) {
        return (
            (_.map(value, (valueObj) => {
                return valueObj.role.role
            })).join("\r\n")
        );
    }

    renderTeams(value) {
        return (
            (_.map(value, (valueObj) => { return valueObj.team.team })).join("\r\n")
        );
    }

    renderTeamMembers(value) {
        let teamMembers = value.map((e) => {
            return `${e.user.firstName} ${e.user.lastName}`
        })

        return (
            teamMembers.join(", ")
        )
    }

    render() {
        const { dispatch, project, loggedUser, members, status, type, users, teams, workstream } = { ...this.props };
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

        const projectManagerOptions = _(users.List)
            .filter((userObj) => {
                const role = (typeof userObj.user_role != "undefined") ? userObj.user_role : userObj.role;
                const roleChecker = _.filter(role, (roleObj) => { return roleObj.roleId < 3 });
                return roleChecker.length > 0;
            })
            .map((e) => {
                return { id: e.id, name: `${e.firstName} ${e.lastName}` }
            }).value();

        if (teams.List.length > 0) {
            teams.List.map((e) => {
                e.team.users_team.map((t) => {
                    let index = _.findIndex(members.List, { userTypeLinkId: t.user.id })
                    if (index < 0) {
                        let userMemberToAdd = { id: e.id, usersType: "team", userTypeLinkId: t.user.id, linkType: "project", user: t.user }
                        members.List.push(userMemberToAdd)
                    }
                })
            })
        }

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" style={{ marginRight: "2px" }}
                        onClick={(e) => {
                            dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                            dispatch({ type: "SET_PROJECT_SELECTED", Selected: {} });
                            dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
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
                                                    <input type="text" name="project" required value={(typeof project.Selected.project == "undefined" || project.Selected.project == null) ? "" : project.Selected.project} class="form-control" placeholder="Project" onChange={this.handleChange} />
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
                                            {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Tin No.</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <input type="text" name="tinNo" value={(typeof project.Selected.tinNo == "undefined" || project.Selected.tinNo == null) ? "" : project.Selected.tinNo} class="form-control" placeholder="Tin No." onChange={this.handleChange} />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) &&
                                                <div class="form-group">
                                                    <label class="col-md-3 col-xs-12 control-label">Company Address</label>
                                                    <div class="col-md-7 col-xs-12">
                                                        <input type="text" name="companyAddress" value={(typeof project.Selected.companyAddress == "undefined" || project.Selected.companyAddress == null) ? "" : project.Selected.companyAddress} class="form-control" placeholder="Company Address" onChange={this.handleChange} />
                                                        <div class="help-block with-errors"></div>
                                                    </div>
                                                </div>
                                            }
                                            <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Project Manager</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown multiple={false}
                                                        required={false}
                                                        options={projectManagerOptions}
                                                        isClearable={(projectManagerOptions.length > 0)}
                                                        selected={project.Selected.projectManagerId}
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
                                                            <th class="text-center">Members</th>
                                                            <th class="text-center"></th>
                                                        </tr>
                                                        {
                                                            <tr>
                                                                {
                                                                    (teams.List.length == 0) && <td style={{ textAlign: "center" }} colSpan={5}>No Record Found!</td>
                                                                }
                                                            </tr>
                                                        }
                                                        {
                                                            teams.List.map((data, index) => {
                                                                return (
                                                                    <tr key={index}>
                                                                        <td class="text-center">{(typeof data.team.id != 'undefined') ? data.team.id : ''}</td>
                                                                        <td class="text-left">{(typeof data.team.id != 'undefined') ? data.team.team : ''}</td>
                                                                        <td class="text-left">{(typeof data.team.teamLeaderId != 'undefined') ? `${data.team.teamLeader.firstName} ${data.team.teamLeader.lastName}` : ''}</td>
                                                                        <td class="text-center">
                                                                            {((data.team.users_team).length > 0) && <span title={`${_.map(data.team.users_team, (o) => { return o.user.firstName + " " + o.user.lastName }).join("\r\n")}`}><i class="fa fa-users fa-lg"></i></span>}
                                                                        </td>
                                                                        <td class="text-center">
                                                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                                                onClick={(e) => this.deleteMember({ usersType: 'team', id: data.id })}
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
                                                            <th class="text-center">Send E-mail reminders</th>
                                                            <th class="text-center"></th>
                                                        </tr>
                                                        {
                                                            (members.List.length == 0) && <tr>
                                                                <td style={{ textAlign: "center" }} colSpan={9}>No Record Found!</td>
                                                            </tr>
                                                        }
                                                        {
                                                            _.orderBy(members.List, ['memberType'], ['desc']).map((data, index) => {
                                                                return (
                                                                    <tr key={index} style={{ color: (data.user.id == project.Selected.projectManagerId) ? "green" : "" }}>
                                                                        <td class="text-center">{data.user.id}</td>
                                                                        <td class="text-left">{data.user.username}</td>
                                                                        <td class="text-left">{data.user.firstName}</td>
                                                                        <td class="text-left">{data.user.lastName}</td>
                                                                        <td class="text-left">{data.user.emailAddress}</td>
                                                                        <td class="text-center">{data.user.userType}</td>
                                                                        <td class="text-left">{this.renderRoles(data.user.user_role)}</td>
                                                                        <td class="text-left">{this.renderTeams(data.user.users_team)}</td>
                                                                        <td>
                                                                            {(data.usersType != "team")
                                                                                ? <input type="checkbox" checked={data.receiveNotification} onChange={() => this.handleReceiveNotifacation(data)} />
                                                                                : "team member"
                                                                            }
                                                                        </td>
                                                                        <td class="text-center">
                                                                            {
                                                                                (data.user.id != project.Selected.projectManagerId && data.usersType != "team")
                                                                                && <a href="javascript:void(0);" data-tip="DELETE"
                                                                                    onClick={(e) => this.deleteMember({ usersType: 'users', id: data.id })}
                                                                                    class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}
                                                                                >
                                                                                    <span class="glyphicon glyphicon-trash"></span>
                                                                                </a>
                                                                            }
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
                                    (typeof project.Selected.id != 'undefined') && <div class="row">
                                        <h3 class="ml20">Workstreams</h3>
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
                                                <Members />
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