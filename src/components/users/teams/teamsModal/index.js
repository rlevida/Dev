import React from "react";
import { DropDown } from "../../../../globalComponents";
import { showToast, postData, putData } from '../../../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        settings: store.settings,
        global: store.global,
        teams: store.teams
    }
})
export default class TeamsModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            nationalityList: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentDidMount() {
        const { dispatch } = this.props;
        $(".teams-modal").validator();
        $('#teamsModal').on('hidden.bs.modal', function (e) {
            dispatch({ type: 'SET_TEAM_SELECTED', Selected: {} });
            $(".teams-modal").validator('destroy');
            $(".teams-modal").validator();
        })
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
        const { teams, loggedUser, dispatch } = this.props
        let result = true;
        let myCurrentTeam = loggedUser.data.team;
        let myTeamIndex = _.findIndex(myCurrentTeam, (o) => { return o.value == teams.Selected.id });
        let selectedTeamMembers = (typeof teams.Selected.users != 'undefined') ? JSON.parse(teams.Selected.users) : [];

        $('.teams-modal *').validator('validate');
        $('.teams-modal .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });
        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

        if (typeof teams.Selected.avatar == "undefined" || !teams.Selected.avatar) {
            teams.Selected.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }

        teams['Selected'].usersId = (teams.Selected.usersId == loggedUser.data.id || typeof teams.Selected.usersId == 'undefined') ? loggedUser.data.id : teams.Selected.usersId;

        if (typeof teams.Selected.id === 'undefined') {
            postData(`/api/teams`, teams.Selected, (c) => {
                dispatch({ type: 'ADD_TEAM_TO_LIST', list: c.data.team })
                dispatch({ type: 'UPDATE_USER_TEAM', List: c.data.user })
                showToast('success', 'Successfully Added.');
                $(`#teamsModal`).modal('hide');
            })
        } else {
            let dataToSubmit = { id: teams.CurrentData.id, teamLeaderId: teams.CurrentData.teamLeaderId }
            _.keys(teams.CurrentData).map((e) => {
                if (JSON.stringify(teams.CurrentData[e]) !== JSON.stringify(teams.Selected[e])) {
                    dataToSubmit = { ...dataToSubmit, [e]: teams.Selected[e] }
                }
            })
            putData(`/api/teams/${dataToSubmit.id}`, dataToSubmit, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'UPDATE_DATA_TEAM_LIST', UpdatedData: c.data.team });
                    dispatch({ type: 'UPDATE_USER_TEAM', List: c.data.user });
                    $(`#teamsModal`).modal('hide');
                    showToast('success', 'Successfully Updated.');
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            })
        }

        if (myTeamIndex >= 0) {
            if (_.filter(selectedTeamMembers, (o) => { return o.value == loggedUser.data.id }).length == 0) {
                let myUpdatedTeam = _.filter(myCurrentTeam, (o) => { return o.value != teams.Selected.id });
                let updatedProfile = { ...loggedUser.data, users_team: myUpdatedTeam }
                dispatch({ type: "SET_LOGGED_USER_DATA", data: updatedProfile })
            }
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
        let Selected = Object.assign({}, teams.Selected)
        Selected[name] = values ? values : []
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    render() {
        const { teams, global } = this.props;
        let usersList = (typeof global.SelectList.usersList != "undefined") ? _(global.SelectList.usersList)
            .filter((user) => {
                return user.userType == "Internal" && user.id != teams.Selected.teamLeaderId;
            })
            .map((user) => { return { id: user.id, name: user.firstName + " " + user.lastName } })
            .orderBy(['name'], ['asc'])
            .value()
            : [];
        let teamLeaderList = (typeof global.SelectList.usersList != "undefined") ? _(global.SelectList.usersList)
            .filter((user) => {
                let alreadyMember = (typeof teams.Selected.users_team == "undefined") ? [] : teams.Selected.users_team;
                let canBeTeamLeader = _.findIndex(user.user_role, (o) => { return o.roleId == 1 || o.roleId == 2 || o.roleId == 3 });
                return user.userType == "Internal" && _.findIndex(alreadyMember, (o) => { return o.value == user.id }) < 0 && canBeTeamLeader >= 0;
            })
            .map((user) => { return { id: user.id, name: user.firstName + " " + user.lastName } })
            .orderBy(['name'], ['asc'])
            .value()
            : [];
        return <div>
            <div class="modal fade" id="teamsModal" tabIndex="-1" role="dialog" aria-labelledby="teamsModalLabel" aria-hidden="true" data-keyboard="false" data-backdrop="static">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h3 class="panel-title">Team {(teams.Selected.id) ? " > Edit > ID: " + teams.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="modal-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container teams-modal">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="team" required value={(typeof teams.Selected.team == "undefined") ? "" : teams.Selected.team} class="form-control" placeholder="Team" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team Leader</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={teamLeaderList}
                                            selected={(typeof teams.Selected.teamLeaderId == "undefined") ? "" : teams.Selected.teamLeaderId}
                                            onChange={(e) => {
                                                this.setDropDown("teamLeaderId", (e == null) ? "" : e.value);
                                            }}
                                            isClearable={(teamLeaderList.length > 0)}
                                        />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Members</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={true}
                                            required={true}
                                            options={usersList}
                                            selected={(typeof teams.Selected.users_team == "undefined") ? [] : teams.Selected.users_team}
                                            onChange={(e) => this.setDropDownMultiple("users_team", e)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            {!(_.isEqual(teams.Selected, teams.CurrentData)) &&
                                <button type="button" class="btn btn-primary" onClick={() => this.handleSubmit()}>Save</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}