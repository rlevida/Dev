import React from "react";

import { showToast } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"

import { connect } from "react-redux";
import {
    filter,
    findIndex
} from "lodash";

@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser,
        role: store.role,
        global: store.global,
        loggedUser: store.loggedUser
    }
})

export default class FormComponent extends React.Component {
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

    componentWillMount() {
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "usersList" });
    }

    componentDidMount() {
        $(".form-container").validator();
    }

    handleDate(e) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, teams, loggedUser, dispatch } = this.props
        let result = true;
        let myCurrentTeam = JSON.parse(loggedUser.data.team);
        let myTeamIndex = findIndex(myCurrentTeam, (o) => { return o.value == teams.Selected.id });
        let selectedTeamMembers = JSON.parse(teams.Selected.users);
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

        if (typeof teams.Selected.avatar == "undefined" || !teams.Selected.avatar) {
            teams.Selected.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }

        teams['Selected'].usersId = (teams.Selected.usersId == loggedUser.data.id) ? loggedUser.data.id : teams.Selected.usersId;

        socket.emit("SAVE_OR_UPDATE_TEAM", { data: teams.Selected });

        if (myTeamIndex >= 0) {
            if (filter(selectedTeamMembers, (o) => { return o.value == loggedUser.data.id }).length == 0) {
                let myUpdatedTeam = filter(myCurrentTeam, (o) => { return o.value != teams.Selected.id });
                let updatedProfile = { ...loggedUser.data, team: JSON.stringify(myUpdatedTeam) }
                dispatch({ type: "SET_LOGGED_USER_DATA", data: updatedProfile })

            }
        }
    }

    setDropDown(name, value) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({}, teams.Selected)
        Selected[name] = JSON.stringify(values ? values : [])
        dispatch({ type: "SET_TEAM_SELECTED", Selected: Selected })
    }

    render() {
        let { dispatch, teams, loggedUser, role, global } = this.props

        let usersList = []
        if (typeof global.SelectList["usersList"] != "undefined") {
            global.SelectList["usersList"].map((e, i) => {
                usersList.push({ id: e.id, name: e.firstName + " " + e.lastName })
            })
        }

        return <div style={{ marginBottom: "50px" }}>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Team {(teams.Selected.id) ? " > Edit > ID: " + teams.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="team" required value={(typeof teams.Selected.team == "undefined") ? "" : teams.Selected.team} class="form-control" placeholder="Team" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={true}
                                            required={false}
                                            options={usersList}
                                            selected={(typeof teams.Selected.users == "undefined") ? [] : JSON.parse(teams.Selected.users)}
                                            onChange={(e) => this.setDropDownMultiple("users", e)} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                            <a class="btn btn-primary" style={{ float: "left", cursor: "pointer", margin: "10px" }} onClick={(e) => {
                                dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                                dispatch({ type: "SET_TEAM_SELECTED", Selected: {} });
                            }} ><span>Back</span>
                            </a>
                            <a class="btn btn-primary" style={{ float: "right", cursor: "pointer", margin: "10px" }} onClick={this.handleSubmit}  >
                                <span>Save</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}