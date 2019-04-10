import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, getData, putData, deleteData, postData } from '../../globalFunction';
import { DeleteModal, DropDown, ColorPicker } from "../../globalComponents";
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

export default class ProjectForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleChange",
            "handleSubmit",
            "setDropDown",
            "handleCheckbox",
            "renderArrayTd",
            "confirmDelete",
            "getMembers",
            "handleColorSlider"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch, project } = this.props;

        getData(`/api/project/getProjectTeams?linkId=${project.Selected.id}&linkType=project&usersType=team`, {}, (c) => {
            dispatch({ type: "SET_TEAM_LIST", list: c.data })
        });

        getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
        });

        this.getMembers();
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
    }

    getMembers() {
        const { dispatch, project } = this.props;
        getData(`/api/project/getProjectMembers?linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_MEMBERS_LIST", list: c.data });
        });
    }

    deleteMember(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: { ...value, action: "delete" } });
        $(`#delete-member`).modal("show");
    }

    confirmDelete() {
        const { members } = { ...this.props };
        const { id, memberByTeam } = members.Selected;

        deleteData(`/api/project/deleteProjectMember/${id}?memberByTeam=${memberByTeam.length > 0}`, {}, (c) => {
            if (c.status == 200) {
                this.getMembers();
                showToast("success", "Successfully Deleted");
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

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
            if (!project.Selected.id) {
                project.Selected.createdBy = loggedUser.data.id;
                postData(`/api/project`, { ...project.Selected }, (c) => {
                    showToast("success", "Project successfully added.");
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data.project });
                    dispatch({ type: "SET_MEMBERS_LIST", list: _.map(c.data.members, ({ user }) => { return user }) });
                });
            } else {
                const dataToSubmit = {
                    project: project.Selected.project,
                    isActive: project.Selected.isActive,
                    typeId: project.Selected.typeId,
                    tinNo: project.Selected.tinNo,
                    companyAddress: project.Selected.companyAddress,
                    classification: project.Selected.classification,
                    projectNameCount: project.Selected.projectNameCount,
                    projectType: project.Selected.projectType,
                    projectManagerId: project.Selected.projectManagerId,
                    color: project.Selected.color,
                    updatedBy: loggedUser.data.id,
                    dateUpdated: moment().format('YYYY-MM-DD HH:mm:ss')
                }
                putData(`/api/project/${project.Selected.id}`, dataToSubmit, (c) => {
                    showToast("success", "Successfully Updated.")
                });
            }
        }
    }

    setDropDown(name, value) {
        const { dispatch, project, members } = this.props;
        const Selected = Object.assign({}, project.Selected);

        if (name == "projectManagerId" && value != "") {
            if (value != project.ProjectManagerId) {
                let newMemberList = members.List.filter((e) => { return e.id != project.ProjectManagerId })
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
        const team = _(value)
            .orderBy(['team'], ['asc'])
            .map((valueObj) => { return valueObj.team })
            .value();
        return team.join("\r\n");
    }

    handleColorSlider(e) {
        const { dispatch, project } = { ...this.props };
        const { Selected } = project
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...Selected, color: e.hex } })
    }

    render() {
        const { dispatch, project, loggedUser, members, status, type, global } = { ...this.props };
        const typeValue = (typeof members.Selected != "undefined" && _.isEmpty(members.Selected) == false) ? members.Selected.firstName + " " + members.Selected.lastName : "";
        const isMemberByTeam = (typeof members.Selected.memberByTeam != "undefined" && _.isEmpty(members.Selected) == false) ? (members.Selected.memberByTeam).length > 0 : false;

        let statusList = [], typeList = [];

        status.List.map((e, i) => { if (e.linkType == "project") { statusList.push({ id: e.id, name: e.status }) } })

        typeList = _(type.List)
            .filter(({ linkType, type }) => {
                if (loggedUser.data.userRole == 4) {
                    return type == "Private" || type == "Internal"
                } else {
                    return linkType == "project"
                }

            })
            .map(({ id, type }) => {
                return { id: id, name: type }
            })
            .value();

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
                                        <label class="custom-checkbox">
                                            <input type="checkbox"
                                                checked={project.Selected.isActive ? true : false}
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox("isActive", (project.Selected.isActive) ? 0 : 1) }}
                                            />
                                            <span class="checkmark"></span>
                                            Active
                                        </label>
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
                                        <label for="project-manager">Color Indicator: <span class="text-red">*</span></label>
                                        <ColorPicker
                                            onSelect={this.handleColorSlider}
                                            color={project.Selected.color}
                                            placeholder={"Select Project Color"}
                                            required={true}
                                        />
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
                                (typeof project.Selected.id != 'undefined' &&
                                    (
                                        loggedUser.data.userRole <= 3 ||
                                        (loggedUser.data.userRole == 4 && (project.Selected.type.type == "Private" || project.Selected.type.type == "Internal"))
                                    )
                                ) && <div class="bt">
                                    <div class="mt20 mb20">
                                        <p class="form-header mb0">Project Members</p>
                                        <p>All with <span class="text-red">*</span> are required.</p>
                                    </div>
                                    <ProjectMemberForm />
                                    <div class="mt20">
                                        {
                                            (members.List.length > 0) && <table>
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
                                                        _.orderBy(members.List, ['firstName'], ['asc']).map((data, index) => {
                                                            return (
                                                                <tr
                                                                    key={index}
                                                                >
                                                                    <td data-label="User Id">
                                                                        {data.id}
                                                                        {
                                                                            (data.id == project.Selected.projectManagerId) && <span title="PROJECT LEAD"><i class="fa fa-user ml5" aria-hidden="true"></i></span>
                                                                        }
                                                                    </td>
                                                                    <td data-label="Username">
                                                                        {data.username}
                                                                    </td>
                                                                    <td data-label="First Name">
                                                                        {data.firstName}
                                                                    </td>
                                                                    <td data-label="Last Name">
                                                                        {data.lastName}
                                                                    </td>
                                                                    <td data-label="Email Address">
                                                                        {data.emailAddress}
                                                                    </td>
                                                                    <td data-label="Member Type">
                                                                        {data.userType}
                                                                    </td>
                                                                    <td data-label="Role(s)">
                                                                        {this.renderRoles(data.user_role)}
                                                                    </td>
                                                                    <td data-label="Team(s)">
                                                                        {this.renderTeams(data.team)}
                                                                    </td>
                                                                    <td data-label="Actions">
                                                                        {
                                                                            (data.id != project.Selected.projectManagerId)
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
                                        }
                                        {
                                            (members.List.length == 0) && <p class="text-center"><strong>No Records Found</strong></p>
                                        }
                                    </div>
                                </div>
                            }
                            {
                                (typeof project.Selected.id != 'undefined' &&
                                    (loggedUser.data.userRole <= 3 || (loggedUser.data.userRole == 4 && (project.Selected.type.type == "Private" || project.Selected.type.type == "Internal")))
                                ) &&
                                <div class="bt">
                                    <div class="mt20 mb20">
                                        <WorkstreamForm project_id={project.Selected.id} is_card={false} />
                                        <WorkstreamList is_card={false} />
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
                    note={(isMemberByTeam) ? "This is a member of a team assigned to this project. Deleting this user will remove all its team assigned to this project. Consider deleting this user from the team in Teams & Users." : ""}
                />
            </div>
        )
    }
}