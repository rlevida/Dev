import React from "react"

import { showToast, postData, getData } from '../../globalFunction'
import { DropDown } from "../../globalComponents"

import { connect } from "react-redux";
import _ from "lodash";

let keyTimer = "";

@connect((store) => {
    return {
        users: store.users,
        members: store.members,
        teams: store.teams,
        project: store.project,
        loggedUser: store.loggedUser,
        global: store.global
    }
})

export default class ProjectMemberForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            showAllUsers: false
        }
        _.map([
            "fetchUserList",
            "fetchTeamList",
            "handleSubmit",
            "setDropDown",
            "setAssignMemberUserList",
            "setAssignMemberTeamList"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} })
    }

    handleSubmit(e) {
        const { members, dispatch, project, loggedUser } = { ...this.props };
        let result = true;

        $('#project-member-form  *').validator('validate');
        $('#project-member-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else if (_.filter(members.List, (o) => { return o.id == members.Selected.userTypeLinkId }).length > 0) {
            showToast("error", "The member selected is already assigned.");
            return;
        } else {
            members.Selected.memberType = 1;

            const dataToSubmit = {
                usersType: members.Selected.type,
                userTypeLinkId: (loggedUser.data.userRole < 4) ? members.Selected.userTypeLinkId : "users",
                linkType: "project",
                linkId: project.Selected.id,
                memberType: 'assignedTo'
            };

            postData(`/api/project/projectMember`, { data: dataToSubmit }, (c) => {
                getData(`/api/project/getProjectMembers?linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
                    dispatch({ type: "SET_MEMBERS_LIST", list: c.data });
                });
                $('#project-member-form *').validator('destroy');
                showToast("success", "Successfully Added.");
                dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
                this.setState({ showAllUsers: false });
            });
        }
    }

    setDropDown(name, value) {
        const { dispatch, members } = this.props;
        let Selected = { ...members.Selected }

        if (name == 'type') {
            Selected = {
                ...Selected,
                [name]: value,
                userTypeLinkId: '',
                memberType: ''
            };

            dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });

            switch (value) {
                case "users":
                    this.setAssignMemberUserList();
                    break;
                case "team":
                    this.setAssignMemberTeamList();
                    break;
            }
        } else {
            Selected = {
                ...Selected,
                [name]: value
            };
        }

        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: Selected })
    }

    fetchUserList(options) {
        const { dispatch } = { ...this.props };
        const { showAllUsers } = { ...this.state };
        let fetchUrl = `/api/user?page=1&showAllUsers=${showAllUsers}`;
        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const memberOptions = _.map(c.data.result, (o) => {
                return { id: o.id, name: `${o.firstName} ${o.lastName}` }
            });
            dispatch({ type: "SET_USER_SELECT_LIST", List: memberOptions });
        });
    }

    fetchTeamList(options) {
        const { dispatch, loggedUser } = this.props;
        let fetchUrl = `/api/teams?page=1&isDeleted=0&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const teamOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.team } })
                .value();

            dispatch({ type: "SET_TEAM_SELECT_LIST", List: teamOptions });
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
        const { users, members, teams, dispatch, loggedUser, project } = this.props;
        const { showAllUsers } = this.state;
        let userTypes = [
            { id: 'users', name: 'User' },
            { id: 'team', name: 'Team' }
        ]

        if (loggedUser.data.userRole >= 4) {
            userTypes = _.filter(userTypes, ({ id }) => {
                return id == "users"
            });
        }

        return (
            <form id="project-member-form">
                {
                    (loggedUser.data.userRole < 4) && <div class="form-group">
                        <label for="tin">Member Type: <span class="text-red">*</span></label>
                        <DropDown
                            multiple={false}
                            required={true}
                            options={userTypes}
                            selected={(typeof members.Selected.type == "undefined") ? "" : members.Selected.type}
                            onChange={(e) => {
                                this.setDropDown("type", e.value);
                            }}
                            placeholder={'Select member type'}
                        />
                    </div>
                }
                <div class="form-group">
                    <label>Member: <span class="text-red">*</span></label>
                    <div class={`display-flex ${(users.Loading == "RETRIEVING" && typeof members.Selected.type != "undefined") ? "pointer-none" : ""}`}>
                        <DropDown
                            required={true}
                            options={(members.Selected.type == "users" || loggedUser.data.userRole >= 4) ? users.SelectList : (members.Selected.type == "team") ? teams.SelectList : []}
                            onInputChange={
                                (members.Selected.type == "users" || loggedUser.data.userRole >= 4) ? this.setAssignMemberUserList : (members.Selected.type == "team") ? this.setAssignMemberTeamList : ""
                            }
                            selected={(typeof members.Selected.userTypeLinkId == "undefined" || members.Selected.action == "delete") ? "" : members.Selected.userTypeLinkId}
                            onChange={(e) => {
                                this.setDropDown("userTypeLinkId", e.value);
                            }}
                            placeholder={'Search name'}
                            onFocus={
                                (members.Selected.type == "users" || loggedUser.data.userRole >= 4) ? this.setAssignMemberUserList : (members.Selected.type == "team") ? this.setAssignMemberTeamList : ""
                            }
                        />
                        <div class="loading diplay-flex vh-center">
                            {
                                (users.Loading == "RETRIEVING" && typeof members.Selected.type != "undefined") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                            }
                        </div>
                    </div>
                </div>
                {
                    (members.Selected.type == "users" && loggedUser.data.userRole < 4) && <div class="form-group">
                        <label class="custom-checkbox">
                            <input type="checkbox"
                                checked={showAllUsers}
                                onChange={() => { }}
                                onClick={(f) => {
                                    this.setState({ showAllUsers: !showAllUsers }, () => {
                                        dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });
                                        this.setAssignMemberUserList();
                                    });
                                }}
                            />
                            <span class="checkmark"></span>
                            Show other users that is not part of my teams
                    </label>
                    </div>
                }
                <a class="btn btn-violet mr5" onClick={this.handleSubmit}>
                    <span>Add member to project</span>
                </a>
            </form>
        )
    }
}