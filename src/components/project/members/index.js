import React from "react"

import { showToast } from '../../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../../globalComponents"

import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        members: store.members,
        teams: store.teams,
        project: store.project
    }
})

export default class MembersForm extends React.Component {
    constructor(props) {
        super(props)

        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
    }

    componentDidMount() {
        $(".member-form-container").validator();
    }

    handleSubmit(e) {
        let { socket, members, type, dispatch, project } = this.props
        let result = true;

        $('.member-form-container *').validator('validate');
        $('.member-form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });
        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

        if (_.has(members.Selected, 'userTypeLinkId') == false || members.Selected.userTypeLinkId == '') {
            showToast("error", "All members are assigned.")
            return;
        }
        members.Selected.memberType = 1;
        dispatch({ type: "SET_FORM_MEMBERS_LOADING", Loading: true })
        socket.emit("SAVE_OR_UPDATE_MEMBERS", {
            data: {
                ...members.Selected,
                usersType: members.Selected.type,
                linkType: "project",
                linkId: project.Selected.id
            }
        });
    }

    setDropDown(name, value) {
        let { dispatch, members } = this.props
        let Selected = { ...members.Selected }

        if (name == 'type') {
            Selected = {
                ...Selected,
                [name]: value,
                userTypeLinkId: '',
                memberType: ''
            }
        } else {
            Selected = {
                ...Selected,
                [name]: value
            }
        }

        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { users, members, teams, project } = this.props;
        let projectManagerId = (typeof project.Selected.projectManagerId != 'undefined') ? project.Selected.projectManagerId : 0;

        let userList = _(users.List)
            .filter((o) => { return o.id != projectManagerId })
            .map((e, i) => {
                if (project.Selected.typeId == 1) {
                    return { id: e.id, name: e.firstName + ' ' + e.lastName }
                } else if (project.Selected.typeId == 2) {
                    if (typeof e.role != "undefined" && e.userType == "Internal") {
                        return { id: e.id, name: e.firstName + ' ' + e.lastName }
                    }
                } else {
                    if (typeof e.role != "undefined" && e.role.length > 0) {
                        return { id: e.id, name: e.firstName + ' ' + e.lastName }
                    }
                }
            })
            .filter(e => { return typeof e != "undefined" })
            .orderBy(['name'])
            .value()

        let userMemberListIds = _(users.List)
            .filter((o) => {
                const memberChecker = _.filter(members.List, (m) => {
                    let isMemberOfTeam = _.findIndex(o.team, (e) => { return e.teamId == m.userTypeLinkId && m.usersType == "team" });
                    return (m.userTypeLinkId == o.id && m.usersType == "users") || isMemberOfTeam >= 0;
                })
                return memberChecker.length > 0
            })
            .map((o) => { return o.id })
            .value();

        userList = userList.filter((e, i) => { return (userMemberListIds).indexOf(e.id) === -1 });

        let teamList = _(teams.List)
            .map((e, i) => { return { id: e.id, name: e.team } })
            .orderBy(['name'])
            .value();


        let teamListIds = _(members.List)
            .filter((o) => { return o.usersType == 'team' })
            .map((o) => { return o.userTypeLinkId })
            .value();
        teamList = teamList.filter((e, i) => { return (teamListIds).indexOf(e.id) === -1 });

        let memberList = (members.Selected.type == 'team') ? teamList : (members.Selected.type == 'users') ? userList : [];

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" onClick={this.handleSubmit} data-toggle="modal" data-target="#projectModal">
                        <span>Save</span>
                    </li>
                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <form onSubmit={this.handleSubmit} class="form-horizontal member-form-container">
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Member Type</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={[
                                            { id: 'users', name: 'User' },
                                            { id: 'team', name: 'Team' }
                                        ]}
                                        selected={(typeof members.Selected.type == "undefined") ? "" : members.Selected.type}
                                        onChange={(e) => {
                                            this.setDropDown("type", e.value);
                                        }}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Member</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={memberList}
                                        selected={(typeof members.Selected.userTypeLinkId == "undefined") ? "" : members.Selected.userTypeLinkId}
                                        onChange={(e) => {
                                            this.setDropDown("userTypeLinkId", e.value);
                                        }}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        )
    }
}