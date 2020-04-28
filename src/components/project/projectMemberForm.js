import React from "react";

import { showToast, postData, getData } from "../../globalFunction";
import { DropDown } from "../../globalComponents";

import { connect } from "react-redux";
import _ from "lodash";

let keyTimer = "";

@connect(store => {
    return {
        users: store.users,
        members: store.members,
        teams: store.teams,
        project: store.project,
        loggedUser: store.loggedUser,
        global: store.global,
        settings: store.settings
    };
})
export default class ProjectMemberForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showAllUsers: false
        };
        _.map(["fetchUserList", "fetchTeamList", "handleSubmit", "setDropDown", "setAssignMemberUserList", "setAssignMemberTeamList"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
    }

    handleSubmit(e) {
        const { members, dispatch, project, loggedUser, teams } = { ...this.props };
        let result = true;

        $("#project-member-form  *").validator("validate");
        $("#project-member-form .form-group").each(function () {
            if ($(this).hasClass("has-error")) {
                result = false;
            }
        });

        const dataToSubmit = {
            usersType: loggedUser.data.userRole < 4 ? members.Selected.type : "users",
            userTypeLinkId: members.Selected.userTypeLinkId,
            linkType: "project",
            linkId: project.Selected.id,
            memberType: "assignedTo"
        };

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        } else if (dataToSubmit.usersType == "users" && _.find(project.Selected.members, { id: members.Selected.userTypeLinkId })) {
            //CHECK IF THE USER SELECTED IS ALREADY IN PROJECT
            showToast("error", "The member selected is already assigned.");
            return;
        } else if (dataToSubmit.usersType == "team") {
            //CHECK IF TEAM MEMBERS ARE ALREADY IN PROJECT
            const projectTeam = _.filter(project.Selected.team, ({ userTypeLinkId }) => {
                return userTypeLinkId == members.Selected.userTypeLinkId;
            });
            if (projectTeam.length > 0) {
                showToast("error", "Team member is already assigned.");
                return;
            }
        }
        postData(`/api/project/projectMember?projectType=${project.Selected.type.type}`, { ...dataToSubmit }, c => {
            if (c.data && c.data.hasError) {
                showToast("error", c.data.message);
            } else {
                if (dataToSubmit.usersType == "users") {
                    const currentProjectMembers = typeof project.Selected.members != "undefined" ? project.Selected.members : [];
                    const currentMember = [
                        ...currentProjectMembers,
                        ..._.map(c.data, ({ id, user }) => {
                            return {
                                avatar: user.avatar,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                id: user.id,
                                emailAddress: user.emailAddress,
                                member_id: id
                            };
                        })
                    ];
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...project.Selected, members: currentMember } });
                } else {
                    const currentProjectTeam = typeof project.Selected.team != "undefined" ? project.Selected.team : [];
                    const currentTeam = [...currentProjectTeam, ...c.data];
                    dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...project.Selected, team: currentTeam } });
                }
                $("#project-member-form *").validator("destroy");
                showToast("success", "Successfully Added.");
                dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
                this.setState({ showAllUsers: false });
            }
        });
    }

    setDropDown(name, value) {
        const { dispatch, members } = this.props;
        let Selected = { ...members.Selected };
        if (name == "type") {
            Selected = {
                ...Selected,
                [name]: value,
                userTypeLinkId: "",
                memberType: ""
            };
            dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });
            setTimeout(() => {
                switch (value) {
                    case "users":
                        this.setAssignMemberUserList();
                        break;
                    case "team":
                        this.setAssignMemberTeamList();
                        break;
                }
            }, 700);
        } else {
            Selected = {
                ...Selected,
                [name]: value
            };
        }

        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: Selected });
    }

    fetchUserList(options) {
        const { dispatch, project, users } = { ...this.props };
        const { showAllUsers } = { ...this.state };
        let fetchUrl = `/api/user?page=1&showAllUsers=${showAllUsers}&project_type=${project.Selected.type.type}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }
        getData(fetchUrl, {}, c => {
            const memberOptions = _.map(c.data.result, o => {
                return { id: o.id, name: `${o.firstName} ${o.lastName}`, image: o.avatar };
            });
            dispatch({ type: "SET_USER_SELECT_LIST", List: _.uniqBy([...users.SelectList, ...memberOptions], "id") });
        });
    }

    fetchTeamList(options) {
        const { dispatch, loggedUser, teams } = this.props;
        let fetchUrl = `/api/teams?page=1&isDeleted=0&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }
        getData(fetchUrl, {}, c => {
            const teamOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.team, teamUsers: e.users_team };
                })
                .value();

            dispatch({ type: "SET_TEAM_SELECT_LIST", List: _.uniqBy([...teams.SelectList, ...teamOptions], "id") });
            dispatch({ type: "SET_USER_LOADING", Loading: "" });
        });
    }

    setAssignMemberUserList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchUserList(options);
        }, 1500);
    }

    setAssignMemberTeamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchTeamList(options);
        }, 1500);
    }

    render() {
        const { users, members, teams, dispatch, loggedUser, settings } = { ...this.props };
        const { showAllUsers } = this.state;
        let userList = _.cloneDeep(users.SelectList);
        let teamList = _.cloneDeep(teams.SelectList);
        let userTypes = [{ id: "users", name: "User" }, { id: "team", name: "Team" }];

        if (loggedUser.data.userRole >= 4) {
            userTypes = _.filter(userTypes, ({ id }) => {
                return id == "users";
            });
        }

        return (
            <form id="project-member-form">
                {loggedUser.data.userRole < 4 && (
                    <div class="form-group">
                        <label for="tin">
                            Member Type: <span class="text-red">*</span>
                        </label>
                        <DropDown
                            multiple={false}
                            required={true}
                            options={userTypes}
                            selected={typeof members.Selected.type == "undefined" ? "" : members.Selected.type}
                            onChange={e => {
                                this.setDropDown("type", e.value);
                            }}
                            placeholder={"Select member type"}
                        />
                    </div>
                )}
                <div class="form-group">
                    <label>
                        Member: <span class="text-red">*</span>
                    </label>
                    <div class={`display-flex ${users.Loading == "RETRIEVING" && typeof members.Selected.type != "undefined" ? "pointer-none" : ""}`} style={{ position: "relative" }}>
                        <DropDown
                            required={true}
                            options={members.Selected.type == "users" || loggedUser.data.userRole >= 4 ? userList : members.Selected.type == "team" ? teamList : []}
                            onInputChange={members.Selected.type == "users" || loggedUser.data.userRole >= 4 ? this.setAssignMemberUserList : members.Selected.type == "team" ? this.setAssignMemberTeamList : undefined}
                            selected={typeof members.Selected.userTypeLinkId == "undefined" || members.Selected.action == "delete" ? "" : members.Selected.userTypeLinkId}
                            isClearable={true}
                            onChange={e => {
                                this.setDropDown("userTypeLinkId", e == null ? null : e.value);
                            }}
                            placeholder={"Search name"}
                            onFocus={members.Selected.type == "users" || loggedUser.data.userRole >= 4 ? this.setAssignMemberUserList : members.Selected.type == "team" ? this.setAssignMemberTeamList : undefined}
                            customLabel={o => {
                                return (
                                    <div class="drop-profile">
                                        {o.image != "" && <img
                                            src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                            alt="Profile Picture" class="img-responsive" />}
                                        <p class="m0">{o.label}</p>
                                    </div>
                                );
                            }}
                            customSelected={({ value: o }) => {
                                return (
                                    <div class="drop-profile">
                                        {o.image != "" && <img
                                            src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                            alt="Profile Picture" class="img-responsive" />}
                                        <p class="m0">{o.label}</p>
                                    </div>
                                );
                            }}
                        />
                        <div class="loading diplay-flex vh-center">{users.Loading == "RETRIEVING" && typeof members.Selected.type != "undefined" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}</div>
                    </div>
                </div>
                {members.Selected.type == "users" && loggedUser.data.userRole < 4 && (
                    <div class="form-group">
                        <label class="custom-checkbox">
                            <input
                                type="checkbox"
                                checked={showAllUsers}
                                onChange={() => { }}
                                onClick={f => {
                                    this.setState({ showAllUsers: !showAllUsers }, () => {
                                        dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });
                                        this.setAssignMemberUserList();
                                    });
                                }}
                            />
                            <span class="checkmark" />
                            Show other users that is not part of my teams
                        </label>
                    </div>
                )}
                <a class="btn btn-violet mr5" onClick={this.handleSubmit}>
                    <span>Add member to project</span>
                </a>
            </form>
        );
    }
}
