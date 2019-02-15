import React from "react";
import moment from 'moment';
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, getData, putData, deleteData, postData } from '../../globalFunction';
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import Members from "./members";
import Workstreams from "./workstream";

let keyTimer = "";

@connect((store) => {
    return {
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

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.setDropDown = this.setDropDown.bind(this);
        this.handleCheckbox = this.handleCheckbox.bind(this);
        this.renderArrayTd = this.renderArrayTd.bind(this);
    }

    componentDidMount() {
        const { dispatch, project } = this.props;

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
        let { dispatch, project } = this.props
        let Selected = Object.assign({}, project.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        const { project, loggedUser, dispatch } = this.props
        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
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

    renderRoles(value) {
        return (
            (_.map(value, (valueObj) => {
                return valueObj.role.role
            })).join("\r\n")
        );
    }

    renderTeams(value) {
        return (
            (_.map(value, (valueObj) => { return valueObj.team.team })).join(", ")
        );
    }

    render() {
        const { dispatch, project, loggedUser, members, status, type, users, teams, workstream, global } = { ...this.props };
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

        const projectManagerOptions = (typeof global.SelectList.usersList !== 'undefined') ? _(global.SelectList.usersList)
            .filter((userObj) => {
                const role = (typeof userObj.user_role != "undefined") ? userObj.user_role : userObj.role;
                const roleChecker = _.filter(role, (roleObj) => { return roleObj.roleId < 4 });
                return roleChecker.length > 0;
            })
            .map((e) => {
                return { id: e.id, name: `${e.firstName} ${e.lastName}` }
            }).value()
            : [];

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
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>Create New Project</h4>
                        </div>
                        <div class="card-body">
                            <form class="form-container">
                                <div class="mb20">
                                    <p class="header mb0">Project Details</p>
                                    <p>All with <span class="text-red">*</span> are required.</p>
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <label>
                                            <input type="checkbox"
                                                checked={project.Selected.isActive ? true : false}
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox("isActive", (project.Selected.isActive) ? 0 : 1) }}
                                            />
                                            Active
                                        </label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="project-name">Project Name: <span class="text-red">*</span></label>
                                    <input id="project-name" type="text" name="project" required value={(typeof project.Selected.project == "undefined" || project.Selected.project == null) ? "" : project.Selected.project} class="form-control" placeholder="Enter project name" onChange={this.handleChange} />
                                    <div class="help-block with-errors"></div>
                                </div>
                                <div class="form-group">
                                    <label for="project-type">Project Type: <span class="text-red">*</span></label>
                                    <DropDown multiple={false}
                                        required={true}
                                        options={typeList}
                                        selected={(typeof project.Selected.typeId == "undefined") ? "" : project.Selected.typeId}
                                        onChange={(e) => this.setDropDown("typeId", e.value)}
                                        placeholder={"Select project type"}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                                {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) &&
                                    <div class="form-group">
                                        <label for="tin">TIN Number:</label>
                                        <input id="tin" type="text" name="tinNo" value={(typeof project.Selected.tinNo == "undefined" || project.Selected.tinNo == null) ? "" : project.Selected.tinNo} class="form-control" placeholder="Enter valid TIN number" onChange={this.handleChange} />
                                    </div>
                                }
                                {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) &&
                                    <div class="form-group">
                                        <label for="comp-address">Company Address:</label>
                                        <input id="comp-address" type="text" name="companyAddress" value={(typeof project.Selected.companyAddress == "undefined" || project.Selected.companyAddress == null) ? "" : project.Selected.companyAddress} class="form-control" placeholder="Enter complete company address" onChange={this.handleChange} />
                                    </div>
                                }
                                <div class="form-group">
                                    <label for="project-manager">Project Lead <span class="text-red">*</span></label>
                                    <DropDown multiple={false}
                                        required={true}
                                        options={projectManagerOptions}
                                        isClearable={(projectManagerOptions.length > 0)}
                                        selected={project.Selected.projectManagerId}
                                        onChange={(e) => {
                                            this.setDropDown("projectManagerId", (e == null) ? "" : e.value);
                                        }}
                                        placeholder={"Search or select project lead"}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <label>
                                            <input type="checkbox"
                                                checked={project.Selected.remindOnDuedate ? true : false}
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox("remindOnDuedate", (project.Selected.remindOnDuedate) ? 0 : 1) }}
                                            />
                                            Remind on due date
                                        </label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="checkbox">
                                        <label>
                                            <input type="checkbox"
                                                checked={project.Selected.remindBeforeDuedate ? true : false}
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox("remindBeforeDuedate", (project.Selected.remindBeforeDuedate) ? 0 : 1) }}
                                            />
                                            Remind before due date
                                        </label>
                                    </div>
                                </div>
                                <a class="btn btn-violet mr5" onClick={this.handleSubmit}>
                                    <span>Add Project</span>
                                </a>
                                <a class="btn btn-default"
                                    onClick={(e) => {
                                        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({ type: "SET_PROJECT_SELECTED", Selected: {} });
                                        dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
                                    }}
                                >
                                    <span>Cancel</span>
                                </a>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}