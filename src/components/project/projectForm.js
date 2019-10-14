import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import Dropzone from "react-dropzone";
import { showToast, getData, putData, deleteData, postData } from "../../globalFunction";
import { DeleteModal, DropDown, ColorPicker } from "../../globalComponents";
import ProjectMemberForm from "./projectMemberForm";
import WorkstreamForm from "../workstream/workstreamForm";
import WorkstreamList from "../workstream/workstreamList";

let keyTimer = "";

@connect(store => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        users: store.users,
        teams: store.teams,
        members: store.members,
        users: store.users,
        document: store.document
    };
})
export default class ProjectForm extends React.Component {
    constructor(props) {
        super(props);

        _.map(["handleChange", "handleSubmit", "setDropDown", "handleCheckbox", "renderArrayTd", "confirmDelete", "handleColorSlider", "onDrop", "upload", "setProjetLeadList"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch, project } = this.props;

        getData(`/api/project/getProjectTeams?linkId=${project.Selected.id}&linkType=project&usersType=team`, {}, c => {
            dispatch({ type: "SET_TEAM_LIST", list: c.data });
            dispatch({ type: "SET_PROJECT_FILTER", filter: { ["typeId"]: 1 } });
        });
        this.fetchProjetLeadList();
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
        dispatch({ type: "SET_TEAM_LIST", list: [], count: {} });
        dispatch({ type: "SET_MEMBERS_LIST", list: [], count: {} });
    }

    deleteMember(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: { ...value, action: "delete" } });
        $(`#delete-member`).modal("show");
    }

    confirmDelete() {
        const { members, project, dispatch } = { ...this.props };
        const { id, member_type, member_type_id } = members.Selected;

        deleteData(`/api/project/deleteProjectMember/${id}?project_id=${project.Selected.id}&member_type=${member_type}&member_type_id=${member_type_id}`, {}, c => {
            if (c.status == 200) {
                if (member_type == "User") {
                    const currentMember = _.filter(project.Selected.members, o => {
                        return o.member_id != id;
                    });
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...project.Selected, members: currentMember } });
                } else {
                    const currentTeam = _.filter(project.Selected.team, o => {
                        return o.team.id != member_type_id;
                    });
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...project.Selected, team: currentTeam } });
                }

                showToast("success", "Successfully Deleted");
            } else {
                showToast("error", c.data.message, 360000);
            }
        });
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
        $(`#delete-member`).modal("hide");
    }

    handleChange(e) {
        const { dispatch, project } = this.props;
        let Selected = Object.assign({}, project.Selected);

        this.setState({
            currentProjectManager: Selected.projectManagerId
        });

        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected });
    }

    handleCheckbox(name, value) {
        let { dispatch, project } = this.props;
        let Selected = Object.assign({}, project.Selected);
        Selected[name] = value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected });
    }

    handleSubmit(e) {
        const { project, loggedUser, dispatch } = this.props;
        let result = true;
        $("#project-form *").validator("validate");
        $("#project-form .form-group").each(function() {
            if ($(this).hasClass("has-error")) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
            if (!project.Selected.id) {
                project.Selected.createdBy = loggedUser.data.id;
                postData(`/api/project`, { ...project.Selected }, c => {
                    if (c.data.error) {
                        showToast("error", c.data.message);
                    } else {
                        showToast("success", "Project successfully added.");
                        dispatch({
                            type: "SET_PROJECT_SELECTED",
                            Selected: {
                                ...c.data.project,
                                members: _.map(c.data.members, ({ user }) => {
                                    return user;
                                })
                            }
                        });
                        dispatch({
                            type: "SET_MEMBERS_LIST",
                            list: _.map(c.data.members, ({ user }) => {
                                return user;
                            })
                        });
                        dispatch({
                            type: "SET_PROJECT_CATEGORY",
                            data: { list: [...project.Category[c.data.project.type.type].list, ...[c.data.project]], count: project.Category[c.data.project.type.type].count },
                            category: c.data.project.type.type
                        });
                    }
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
                    dateUpdated: moment().format("YYYY-MM-DD HH:mm:ss")
                };
                putData(`/api/project/${project.Selected.id}`, dataToSubmit, c => {
                    showToast("success", "Successfully Updated.");
                });
            }
        }
    }

    setDropDown(name, value) {
        const { dispatch, project, members, loggedUser } = this.props;
        const Selected = Object.assign({}, project.Selected);

        if (name == "projectManagerId" && value != "") {
            if (value != project.ProjectManagerId) {
                let newMemberList = members.List.filter(e => {
                    return e.id != project.ProjectManagerId;
                });
                dispatch({ type: "SET_PROJECT_MANAGER_ID", id: name });
                dispatch({ type: "SET_MEMBERS_LIST", list: newMemberList });
            }
        }
        if (name == "typeId" && value === 3) {
            Selected["projectManagerId"] = loggedUser.data.id;
        }
        Selected[name] = value;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: Selected });
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    renderArrayTd(arr) {
        return arr.join("\r\n");
    }

    renderRoles(value) {
        return _.map(value, valueObj => {
            return valueObj.role.role;
        }).join("\r\n");
    }

    handleColorSlider(e) {
        const { dispatch, project } = { ...this.props };
        const { Selected } = project;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...Selected, color: e.hex } });
    }

    onDrop(picture) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FILES", Files: picture });
    }

    upload() {
        const { document, project, dispatch } = { ...this.props };
        const { Selected } = project;
        let data = new FormData();

        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING" });
        _.map(document.Files, file => {
            data.append("file", file);
            data.append("project_id", project.Selected.id);
        });

        postData(`/api/project/upload?projectId=${project.Selected.id}`, data, c => {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
            dispatch({ type: "SET_DOCUMENT_FILES", Files: "" });
            dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...Selected, picture: c.data } });
            showToast("success", "Project picture successfully uploaded.");

            $("#upload-picture").modal("hide");
        });
    }

    setProjetLeadList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchProjetLeadList(options);
        }, 1500);
    }

    fetchProjetLeadList(options) {
        const { dispatch, loggedUser } = this.props;
        let fetchUrl = "/api/user?page=1&isDeleted=0&type=teamLead";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }

        getData(fetchUrl, {}, c => {
            let projectLeadList = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.firstName + " " + e.lastName, image: e.avatar };
                })
                .value();

            let hasLoggedUser = _.find(projectLeadList, { id: loggedUser.data.id });
            if (!hasLoggedUser && loggedUser.data.userRole <= 3) {
                projectLeadList.push({ id: loggedUser.data.id, name: `${loggedUser.data.firstName} ${loggedUser.data.lastName}`, image: loggedUser.data.avatar });
            }
            dispatch({ type: "SET_USER_SELECT_LIST", List: projectLeadList });
        });
    }

    render() {
        const { dispatch, project, loggedUser, status, type, users, document, members } = { ...this.props };
        const { Files, Loading: documentLoading } = document;
        const typeValue = typeof members.Selected != "undefined" && _.isEmpty(members.Selected) == false ? members.Selected.name : "";
        const memberList = [
            ..._.map(project.Selected.members, ({ firstName, lastName, member_id, id, emailAddress }) => {
                return {
                    id: member_id,
                    name: firstName + " " + lastName,
                    member_type: "User",
                    member_type_id: id,
                    email: emailAddress
                };
            }),
            ..._.map(project.Selected.team, ({ id, team }) => {
                return {
                    id: id,
                    name: team.team,
                    member_type: "Team",
                    member_type_id: team.id,
                    users_team: team.users_team
                };
            })
        ];
        let projectManagerOptions = users.SelectList;
        let statusList = [],
            typeList = [];

        status.List.map((e, i) => {
            if (e.linkType == "project") {
                statusList.push({ id: e.id, name: e.status });
            }
        });

        typeList = _(type.List)
            .filter(({ linkType, type }) => {
                if (loggedUser.data.userRole == 4) {
                    return type == "Private" || type == "Internal";
                } else {
                    return linkType == "project";
                }
            })
            .map(({ id, type }) => {
                return { id: id, name: type };
            })
            .value();

        if (typeof project.Selected.id != "undefined" && project.Selected.id != "") {
            projectManagerOptions = _.uniqBy(
                [
                    ...projectManagerOptions,
                    ..._(project.Selected.members)
                        .filter(({ id }) => {
                            return id == project.Selected.projectManagerId;
                        })
                        .map(e => {
                            return {
                                id: e.id,
                                name: e.firstName + " " + e.lastName,
                                image: e.avatar
                            };
                        })
                        .value()
                ],
                "id"
            );
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
                                    <i class="fa fa-chevron-left" aria-hidden="true" />
                                </a>
                                {typeof project.Selected.id != "undefined" && project.Selected.id != "" ? "Edit " : "Add New "}
                                Project
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="mb20">
                                <form id="project-form">
                                    <div class="mb20">
                                        <p class="form-header mb0">Project Details</p>
                                        <p>
                                            All with <span class="text-red">*</span> are required.
                                        </p>
                                    </div>
                                    {typeof project.Selected.id != "undefined" && (
                                        <div>
                                            <label>Project Picture:</label>
                                            <div class="project-picture-wrapper mb20">
                                                <img src={project.Selected.picture} alt="Profile Picture" class="img-responsive" />
                                                <a
                                                    onClick={() => {
                                                        $("#upload-picture").modal("show");
                                                    }}
                                                >
                                                    <i class="fa fa-camera" />
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    <div class="form-group">
                                        <label class="custom-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={project.Selected.isActive ? true : false}
                                                onChange={() => {}}
                                                onClick={f => {
                                                    this.handleCheckbox("isActive", project.Selected.isActive ? 0 : 1);
                                                }}
                                            />
                                            <span class="checkmark" />
                                            Active
                                        </label>
                                    </div>
                                    <div class="form-group">
                                        <label for="project-name">
                                            Project Name: <span class="text-red">*</span>
                                        </label>
                                        <input
                                            id="project-name"
                                            type="text"
                                            name="project"
                                            required
                                            value={typeof project.Selected.project == "undefined" || project.Selected.project == null ? "" : project.Selected.project}
                                            class="form-control"
                                            placeholder="Enter project name"
                                            onChange={this.handleChange}
                                        />
                                    </div>
                                    <div class="form-group">
                                        <label for="project-type">
                                            Project Type: <span class="text-red">*</span>
                                        </label>
                                        <DropDown
                                            multiple={false}
                                            required={true}
                                            options={typeList}
                                            selected={typeof project.Selected.typeId == "undefined" ? "" : project.Selected.typeId}
                                            onChange={e => this.setDropDown("typeId", e.value)}
                                            placeholder={"Select project type"}
                                        />
                                    </div>
                                    {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) && (
                                        <div class="form-group">
                                            <label for="tin">TIN Number:</label>
                                            <input
                                                id="tin"
                                                type="text"
                                                name="tinNo"
                                                value={typeof project.Selected.tinNo == "undefined" || project.Selected.tinNo == null ? "" : project.Selected.tinNo}
                                                class="form-control"
                                                placeholder="Enter valid TIN number"
                                                onChange={this.handleChange}
                                            />
                                        </div>
                                    )}
                                    {(typeof project.Selected.typeId == "undefined" || project.Selected.typeId == 1) && (
                                        <div class="form-group">
                                            <label for="comp-address">Company Address:</label>
                                            <input
                                                id="comp-address"
                                                type="text"
                                                name="companyAddress"
                                                value={typeof project.Selected.companyAddress == "undefined" || project.Selected.companyAddress == null ? "" : project.Selected.companyAddress}
                                                class="form-control"
                                                placeholder="Enter complete company address"
                                                onChange={this.handleChange}
                                            />
                                        </div>
                                    )}
                                    <div class="form-group">
                                        <label for="project-manager">
                                            Project Lead: <span class="text-red">*</span>
                                        </label>
                                        <DropDown
                                            required={true}
                                            options={
                                                typeof project.Selected.typeId && project.Selected.typeId === 3
                                                    ? [{ id: loggedUser.data.id, name: `${loggedUser.data.firstName} ${loggedUser.data.lastName}`, image: loggedUser.data.avatar }]
                                                    : projectManagerOptions
                                            }
                                            onInputChange={this.setProjetLeadList}
                                            selected={typeof project.Selected.typeId && project.Selected.typeId === 3 ? loggedUser.data.id : typeof project.Selected.projectManagerId == "undefined" ? "" : project.Selected.projectManagerId}
                                            placeholder={"Search and select project lead"}
                                            onChange={e => {
                                                this.setDropDown("projectManagerId", e == null ? "" : e.value);
                                            }}
                                            customLabel={o => {
                                                return (
                                                    <div class="drop-profile">
                                                        {o.image != "" && <img src={o.image} alt="Profile Picture" class="img-responsive" />}
                                                        <p class="m0">{o.label}</p>
                                                    </div>
                                                );
                                            }}
                                            customSelected={({ value: o }) => {
                                                return (
                                                    <div class="drop-profile">
                                                        {o.image != "" && <img src={o.image} alt="Profile Picture" class="img-responsive" />}
                                                        <p class="m0">{o.label}</p>
                                                    </div>
                                                );
                                            }}
                                            disabled={typeof project.Selected.typeId && project.Selected.typeId === 3}
                                            isClearable={users.SelectList.length > 0}
                                        />
                                    </div>
                                    <div class="form-group">
                                        <label for="project-manager">
                                            Color Indicator: <span class="text-red">*</span>
                                        </label>
                                        <ColorPicker onSelect={this.handleColorSlider} color={project.Selected.color} placeholder={"Select Project Color"} required={true} />
                                    </div>
                                    <a class="btn btn-violet mr5" onClick={this.handleSubmit}>
                                        <span>{`${typeof project.Selected.id != "undefined" && project.Selected.id != "" ? "Edit" : "Add"} project`}</span>
                                    </a>
                                    <a
                                        class="btn btn-default"
                                        onClick={e => {
                                            dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                                            dispatch({ type: "SET_PROJECT_SELECTED", Selected: {} });
                                            dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
                                        }}
                                    >
                                        <span>Cancel</span>
                                    </a>
                                </form>
                            </div>
                            {typeof project.Selected.id != "undefined" && (loggedUser.data.userRole <= 3 || (loggedUser.data.userRole == 4 && (project.Selected.type.type == "Private" || project.Selected.type.type == "Internal"))) && (
                                <div class="bt">
                                    <div class="mt20 mb20">
                                        <p class="form-header mb0">Project Members</p>
                                        <p>
                                            All with <span class="text-red">*</span> are required.
                                        </p>
                                    </div>
                                    <ProjectMemberForm />
                                    <div class="mt20">
                                        {memberList.length > 0 && (
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th scope="col" class="td-left">
                                                            Name
                                                        </th>
                                                        <th scope="col">Member Type</th>
                                                        <th scope="col">Email Address</th>
                                                        <th scope="col">Members</th>
                                                        <th scope="col">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {_.orderBy(memberList, ["name"], ["asc"]).map((params, index) => {
                                                        const { name, member_type, member_type_id, email = "N/A", users_team = [] } = params;
                                                        return (
                                                            <tr key={index}>
                                                                <td data-label="Name" class="td-left">
                                                                    {name}
                                                                </td>
                                                                <td data-label="Member Type">{member_type}</td>
                                                                <td data-label="Email Address">{email}</td>
                                                                <td data-label="Members">
                                                                    {users_team.length > 0
                                                                        ? this.renderArrayTd(
                                                                              _.map(users_team, ({ user }) => {
                                                                                  return user.firstName + " " + user.lastName;
                                                                              })
                                                                          )
                                                                        : "N/A"}
                                                                </td>
                                                                <td data-label="Actions">
                                                                    {((project.Selected.projectManagerId != member_type_id && member_type == "User") || member_type == "Team") && (
                                                                        <a href="javascript:void(0);" title="DELETE" onClick={e => this.deleteMember(params)} class="btn btn-action">
                                                                            <span class="fa fa-trash" />
                                                                        </a>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                        {memberList.length == 0 && (
                                            <p class="text-center">
                                                <strong>No Records Found</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {typeof project.Selected.id != "undefined" && (loggedUser.data.userRole <= 3 || (loggedUser.data.userRole == 4 && (project.Selected.type.type == "Private" || project.Selected.type.type == "Internal"))) && (
                                <div class="bt">
                                    <div class="mt20 mb20">
                                        <WorkstreamForm project_id={project.Selected.id} is_card={false} />
                                        <WorkstreamList is_card={false} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Modals */}
                <DeleteModal id="delete-member" type={"member"} type_value={typeValue} delete_function={this.confirmDelete} />
                <div id="upload-picture" class="modal fade upload-modal" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-sm" role="document">
                        <div class="modal-content">
                            <div class="modal-body">
                                <p>
                                    <strong>Upload Project Picture</strong>
                                </p>
                                <Dropzone accept=".jpg,.png,.jpeg" onDrop={this.onDrop} class="document-file-upload" multiple={false}>
                                    <div style={{ textAlign: "center", height: "100%", padding: "60px" }}>
                                        <div class="upload-wrapper">{Files.length > 0 ? <img src={Files[0].preview} alt="Profile Picture" class="img-responsive" /> : <p>Drop the best project picture here</p>}</div>
                                    </div>
                                </Dropzone>
                                <div class="mt20">
                                    {Files.length > 0 && (
                                        <a class="btn btn-violet mr5" onClick={this.upload} disabled={documentLoading == "SUBMITTING"}>
                                            <span>{documentLoading == "SUBMITTING" ? "Uploading..." : "Upload Picture"}</span>
                                        </a>
                                    )}
                                    <a class="btn btn-default" data-dismiss="modal" disabled={documentLoading == "SUBMITTING"}>
                                        <span>Cancel</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
