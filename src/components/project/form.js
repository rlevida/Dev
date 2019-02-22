import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, getData, putData, deleteData, postData } from '../../globalFunction';
import { DeleteModal, DropDown } from "../../globalComponents";
import ProjectMemberForm from "./projectMemberForm";
import WorkstreamForm from "../workstream/workstreamForm";
import WorkstreamList from "../workstream/workstreamList";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        users: store.users,
        teams: store.teams,
        members: store.members,
        global: store.global
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleChange",
            "handleSubmit",
            "setDropDown",
            "handleCheckbox",
            "renderArrayTd",
            "confirmDelete"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
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
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: value });
        $(`#delete-member`).modal("show");
    }

    confirmDelete() {
        const { dispatch, members } = { ...this.props };
        const { id, usersType } = members.Selected;

        deleteData(`/api/project/deleteProjectMember/${id}`, {}, (c) => {
            if (c.status == 200) {
                if (usersType == "users") {
                    dispatch({ type: "REMOVE_DELETED_MEMBERS_LIST", id: c.data });
                    dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
                } else {
                    let newMemberList = members.List.filter((e) => { return e.id != c.data })

                    dispatch({ type: "REMOVE_DELETED_TEAM_LIST", id: c.data })
                    dispatch({ type: "SET_MEMBERS_LIST", list: newMemberList })
                }
                showToast("success", "Successfully Deleted")
            } else {
                showToast("error", "Delete failed. Please try again.")
            }
        });

        $(`#delete-member`).modal("hide");
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

        $('#project-form *').validator('validate');
        $('#project-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        // if (!result) {
        //     showToast("error", "Please fill up the required fields.");
        // } else {
        //     if (!project.Selected.id) {
        //         project.Selected.createdBy = loggedUser.data.id;
        //         postData(`/api/project`, { ...project.Selected }, (c) => {
        //             showToast("success", "Project successfully added.");
        //             dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data.project });
        //             dispatch({ type: "SET_MEMBERS_LIST", list: c.data.members });
        //         });
        //     } else {
        //         const dataToSubmit = {
        //             project: project.Selected.project,
        //             isActive: project.Selected.isActive,
        //             typeId: project.Selected.typeId,
        //             tinNo: project.Selected.tinNo,
        //             companyAddress: project.Selected.companyAddress,
        //             classification: project.Selected.classification,
        //             projectNameCount: project.Selected.projectNameCount,
        //             projectType: project.Selected.projectType,
        //             projectManagerId: project.Selected.projectManagerId
        //         }
        //         putData(`/api/project/${project.Selected.id}`, dataToSubmit, (c) => {
        //             dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
        //             showToast("success", "Successfully Updated.")
        //         })
        //     }
        // }
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
        const { dispatch, project, loggedUser, members, status, type, teams, global } = { ...this.props };
        const typeValue = (typeof members.Selected.user != "undefined" && _.isEmpty(members.Selected) == false) ? members.Selected.user.firstName + " " + members.Selected.user.lastName : "";

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
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New Project
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="mb20">
                                <form id="project-form">
                                    <div class="mb20">
                                        <p class="form-header mb0">Project Details</p>
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
                                        <label for="project-manager">Project Lead: <span class="text-red">*</span></label>
                                        <DropDown multiple={false}
                                            required={true}
                                            options={projectManagerOptions}
                                            selected={project.Selected.projectManagerId}
                                            onChange={(e) => {
                                                this.setDropDown("projectManagerId", (e == null) ? "" : e.value);
                                            }}
                                            placeholder={"Search or select project lead"}
                                        />
                                       
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
                                        <span>{`${(typeof project.Selected.id != "undefined" && project.Selected.id != "") ? "Edit" : "Add"} Project`}</span>
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
                            {
                                (typeof project.Selected.id != 'undefined' && project.Selected.typeId != "3") && <div class="bt">
                                    <div class="mt20 mb20">
                                        <p class="form-header mb0">Project Members</p>
                                        <p>All with <span class="text-red">*</span> are required.</p>
                                    </div>
                                    <ProjectMemberForm />
                                    <div class="mt20">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th scope="col">User Id</th>
                                                    <th scope="col">Username</th>
                                                    <th scope="col">First Name</th>
                                                    <th scope="col">Last Name</th>
                                                    <th scope="col">Email Address</th>
                                                    <th scope="col">Member Type</th>
                                                    <th scope="col">Role(s)</th>
                                                    <th scope="col">Team(s)</th>
                                                    <th scope="col">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    _.orderBy(members.List, ['memberType'], ['desc']).map((data, index) => {
                                                        return (
                                                            <tr
                                                                key={index}
                                                                style={{ color: (data.user.id == project.Selected.projectManagerId) ? "green" : "" }}
                                                            >
                                                                <td data-label="User Id">
                                                                    {data.user.id}
                                                                </td>
                                                                <td data-label="Username">
                                                                    {data.user.username}
                                                                </td>
                                                                <td data-label="First Name">
                                                                    {data.user.firstName}
                                                                </td>
                                                                <td data-label="Last Name">
                                                                    {data.user.lastName}
                                                                </td>
                                                                <td data-label="Email Address">
                                                                    {data.user.emailAddress}
                                                                </td>
                                                                <td data-label="Member Type">
                                                                    {data.user.userType}
                                                                </td>
                                                                <td data-label="Role(s)">
                                                                    {this.renderRoles(data.user.user_role)}
                                                                </td>
                                                                <td data-label="Team(s)">
                                                                    {this.renderTeams(data.user.users_team)}
                                                                </td>
                                                                <td data-label="Actions">
                                                                    {
                                                                        (data.user.id != project.Selected.projectManagerId && data.usersType != "team")
                                                                        && <a href="javascript:void(0);" title="DELETE"
                                                                            onClick={(e) => this.deleteMember(data)}
                                                                            class={data.allowedDelete == 0 ? 'hide' : 'btn btn-action'}
                                                                        >
                                                                            <span class="glyphicon glyphicon-trash"></span>
                                                                        </a>
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                        {
                                            (members.List.length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                        }
                                    </div>
                                </div>
                            }
                            {
                                (typeof project.Selected.id != 'undefined' && project.Selected.typeId != "3") &&
                                <div class="bt">
                                    <div class="mt20 mb20">
                                        <WorkstreamForm project_id={project.Selected.id} />
                                        <WorkstreamList />
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
                {/* Modals */}
                <DeleteModal
                    id="delete-member"
                    type={'member'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
            </div>
        )
    }
}