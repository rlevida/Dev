import React from "react"

import { showToast, postData } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"

import { connect } from "react-redux";
import _ from "lodash";

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
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
    }

    handleSubmit(e) {
        const { members, dispatch, project } = { ...this.props };
        let result = true;

        $('#project-member-form  *').validator('validate');
        $('#project-member-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else if (_.has(members.Selected, 'userTypeLinkId') == false || members.Selected.userTypeLinkId == '') {
            showToast("error", "All members are assigned.")
            return;
        } else {
            members.Selected.memberType = 1;

            const dataToSubmit = {
                usersType: members.Selected.type,
                userTypeLinkId: members.Selected.userTypeLinkId,
                linkType: "project",
                linkId: project.Selected.id,
                memberType: 'assignedTo'
            };

            postData(`/api/project/projectMember`, { data: dataToSubmit }, (c) => {
                if (members.Selected.type == "users") {
                    dispatch({ type: "ADD_MEMBER_TO_LIST", list: c.data });
                } else {
                    dispatch({ type: "ADD_TEAM_TO_LIST", list: c.data });
                }
                $('#project-member-form *').validator('destroy');
                showToast("success", "Successfully Added.");
                dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} });
                this.setState({ showAllUsers: false });
            });
        }
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
        let { users, members, teams, loggedUser, global } = this.props;
        let { showAllUsers } = this.state
        let memberList = []

        if (typeof members.Selected.type != "undefined") {
            if (members.Selected.type == 'users') {
                if (!showAllUsers) {
                    global.SelectList.teamList.map((e) => {
                        if (e.teamLeaderId == loggedUser.data.id && e.users_team.length > 0) {
                            e.users_team.map((t) => {
                                let index = _.findIndex(members.List, { userTypeLinkId: t.user.id })
                                if (index < 0) {
                                    memberList.push({ id: t.user.id, name: `${t.user.firstName} ${t.user.lastName}` })
                                }
                            })
                        }
                    })
                } else {
                    users.List.map((e) => {
                        let index = _.findIndex(members.List, { userTypeLinkId: e.id })
                        if (index < 0) {
                            memberList.push({ id: e.id, name: `${e.firstName} ${e.lastName}` })
                        }
                    })
                }
            } else if (members.Selected.type == 'team') {
                global.SelectList.teamList.map((e) => {
                    let index = _.findIndex(teams.List, { userTypeLinkId: e.id })
                    if (index < 0) {
                        memberList.push({ id: e.id, name: e.team })
                    }
                })
            }
        }


        return (
            <form id="#project-member-form">
                <div class="form-group">
                    <label for="tin">Member Type: <span class="text-red">*</span></label>
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
                        placeholder={'Select member type'}
                    />
                    <div class="help-block with-errors"></div>
                </div>
                <div class="form-group">
                    <label>Member: <span class="text-red">*</span></label>
                    <DropDown multiple={false}
                        required={true}
                        options={memberList}
                        selected={(typeof members.Selected.userTypeLinkId == "undefined") ? "" : members.Selected.userTypeLinkId}
                        onChange={(e) => {
                            this.setDropDown("userTypeLinkId", e.value);
                        }}
                        placeholder={'Search or select user'}
                    />
                    <div class="help-block with-errors"></div>
                </div>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox"
                                checked={showAllUsers}
                                onChange={() => { }}
                                onClick={(f) => this.setState({ showAllUsers: !showAllUsers })}
                            />
                            Show other users that is not part of my teams
                        </label>
                    </div>
                </div>
                <a class="btn btn-violet mr5" onClick={this.handleSubmit}>
                    <span>Add member to project</span>
                </a>
            </form>
        )
    }
}