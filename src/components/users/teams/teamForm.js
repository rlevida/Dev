import React from "react";
import _ from "lodash";
import { connect } from "react-redux";

import { DropDown } from "../../../globalComponents";
import { showToast, postData, putData, getData } from '../../../globalFunction';

let keyTimer = "";
@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        settings: store.settings,
        global: store.global,
        users: store.users,
        teams: store.teams
    }
})
export default class TeamForm extends React.Component {
    constructor(props) {
        super(props)

        _.map([
            'setTeamMemberList',
            'fetchTeamMemberList',
            'setTeamLeadList',
            'fetchTeamLeadList',
            'handleChange',
            'handleSubmit',
            'setDropDown',
            'setDropDownMultiple'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        })
    }

    componentDidMount() {
        this.fetchTeamLeadList();
        this.fetchTeamMemberList();
    }

    handleDate(e) {
        const { dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        const { dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        const { teams, loggedUser, dispatch } = this.props;
        const dataToBeSubmitted = {
            ...teams.Selected,
            usersId: (teams.Selected.usersId == loggedUser.data.id || typeof teams.Selected.usersId == 'undefined') ? loggedUser.data.id : teams.Selected.usersId
        };
        const myCurrentTeam = [...loggedUser.data.team];
        const myTeamIndex = _.findIndex(myCurrentTeam, (o) => { return o.id == dataToBeSubmitted.id });

        let result = true;


        $('#team-form *').validator('validate');
        $('#team-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        }

        if (typeof dataToBeSubmitted.id === 'undefined') {
            postData(`/api/teams`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'ADD_TEAM_TO_LIST', list: c.data.team });
                    dispatch({ type: 'UPDATE_USER_TEAM', List: c.data.user });
                    dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                    showToast('success', 'Team successfully added.');

                    let updatedProfile = "";
                    if (_.filter(dataToBeSubmitted.users_team, (o) => { return o.value == loggedUser.data.id }).length > 0 || dataToBeSubmitted.teamLeaderId == loggedUser.data.id) {
                        updatedProfile = { ...loggedUser.data, team: [...myCurrentTeam, ...c.data.team] };
                    }
                    dispatch({ type: "SET_LOGGED_USER_DATA", data: updatedProfile });
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            });
        } else {
            putData(`/api/teams/${dataToBeSubmitted.id}`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'UPDATE_DATA_TEAM_LIST', UpdatedData: c.data.team });
                    dispatch({ type: 'UPDATE_USER_TEAM', List: c.data.user });
                    dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                    showToast('success', 'Team successfully updated.');

                    let updatedProfile = "";

                    if (myTeamIndex >= 0 || _.filter(dataToBeSubmitted.users_team, (o) => { return o.value == loggedUser.data.id }).length > 0 || teamLeaderId == loggedUser.data.id) {
                        myCurrentTeam.splice(myTeamIndex, 1, _.omit(c.data.team, ['users_team']));
                        updatedProfile = { ...loggedUser.data, team: myCurrentTeam };
                    } else {
                        updatedProfile = {
                            ...loggedUser.data,
                            team: _.remove(myCurrentTeam, function (o) {
                                return o.id != dataToBeSubmitted.id;
                            })
                        };
                    }
                    dispatch({ type: "SET_LOGGED_USER_DATA", data: updatedProfile });
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            });
        }
    }

    setDropDown(name, value) {
        const { dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        let isMember = 0;

        Selected[name] = value;

        if (typeof Selected.users_team !== 'undefined') {
            isMember = Selected.users_team.filter((e) => { return e.value == value }).length > 0 ? 1 : 0;
        }
        if (isMember) {
            dispatch({ type: 'SET_TEAM_SELECTED', Selected: { ...Selected, users_team: Selected.users_team.filter((e) => { return e.value != value }) } })
        } else {
            dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
        }
    }

    setDropDownMultiple(name, values) {
        const { dispatch, teams } = this.props
        const selected = { ...teams.Selected, [name]: values };
        dispatch({ type: "SET_TEAM_SELECTED", Selected: selected })
    }

    setTeamLeadList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchTeamLeadList(options);
        }, 1500);
    }

    fetchTeamLeadList(options) {
        const { dispatch, teams } = this.props;
        let fetchUrl = "/api/user?page=1&isDeleted=0";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .filter((user) => {
                    const alreadyMember = (typeof teams.Selected.users_team == "undefined") ? [] : teams.Selected.users_team;
                    const canBeTeamLeader = _.findIndex(user.user_role, (o) => { return o.roleId <= 3 });

                    return user.userType == "Internal" && _.findIndex(alreadyMember, (o) => { return o.value == user.id }) < 0 && canBeTeamLeader >= 0;
                })
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                .value();
            dispatch({ type: "SET_USER_SELECT_LIST", List: taskMemberOptions });
        });
    }

    setTeamMemberList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchTeamMemberList(options);
        }, 1500);
    }

    fetchTeamMemberList(options) {
        const { dispatch } = this.props;
        let fetchUrl = "/api/user?page=1&isDeleted=0";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                .value();
            dispatch({ type: "SET_TEAM_MEMBER_SELECT_LIST", List: taskMemberOptions });
        });
    }


    render() {
        const { teams, users } = this.props;

        return <div>
            <div class="mb20">
                <form id="team-form">
                    <div class="mb20">
                        <p class="form-header mb0">Teams</p>
                        <p>All with <span class="text-red">*</span> are required.</p>
                    </div>
                    <div class="form-group">
                        <label>Team Name: <span class="text-red">*</span></label>
                        <input
                            type="text"
                            name="team"
                            required
                            value={(typeof teams.Selected.team == "undefined") ? "" : teams.Selected.team}
                            class="form-control"
                            placeholder="Enter team name"
                            onChange={this.handleChange}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>Team Leader: <span class="text-red">*</span></label>
                        <DropDown
                            required={true}
                            options={users.SelectList}
                            onInputChange={this.setTeamLeadList}
                            selected={(typeof teams.Selected.teamLeaderId == "undefined") ? "" : teams.Selected.teamLeaderId}
                            placeholder={"Search and select team leader"}
                            onChange={(e) => {
                                this.setDropDown("teamLeaderId", (e == null) ? "" : e.value);
                            }}
                            isClearable={((users.SelectList).length > 0)}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>Members: <span class="text-red">*</span></label>
                        <DropDown
                            multiple={true}
                            required={true}
                            options={_.filter(teams.MemberList, (o) => { return o.id != teams.Selected.teamLeaderId })}
                            onInputChange={this.setTeamMemberList}
                            selected={(typeof teams.Selected.users_team == "undefined") ? [] : teams.Selected.users_team}
                            placeholder={"Search and select team members"}
                            onChange={(e) => {
                                this.setDropDownMultiple("users_team", (e == null) ? [] : e);
                            }}
                            isClearable={((teams.MemberList).length > 0)}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <a class="btn btn-violet" onClick={this.handleSubmit}>
                        <span>{`${(typeof teams.Selected.id != "undefined" && teams.Selected.id != "") ? 'Edit' : 'Add'} Team`}</span>
                    </a>
                </form>
            </div>
        </div>
    }
}