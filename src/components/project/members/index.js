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
        let { socket, members, type } = this.props
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
        socket.emit("SAVE_OR_UPDATE_MEMBERS", {
            data: {
                ...members.Selected,
                usersType: members.Selected.type,
                linkType: type.label,
                linkId: type.data.Selected.id
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
        let typeList = [
            { id: 'assignedTo', name: 'Assigned' },
            { id: 'Follower', name: 'Follower' },
            { id: 'responsible', name: 'Responsible' },
        ];
        let projectManagerId = (typeof this.props.type.data.Selected.projectManagerId != 'undefined') ? this.props.type.data.Selected.projectManagerId : 0;
        let userList = _(users.List)
            .filter((o) => { return o.id != projectManagerId })
            .map((e, i) => {
                if (project.Selected.typeId == 1) {
                    return { id: e.id, name: e.firstName + ' ' + e.lastName }
                } else {
                    if (typeof e.role != "undefined" && e.role.length > 0) {
                        return { id: e.id, name: e.firstName + ' ' + e.lastName }
                    }
                }
            })
            .orderBy(['name'])
            .value();

        let userMemberListIds = _(members.List)
            .filter((o) => {
                return o.usersType == 'users' && o.id != projectManagerId
            })
            .map((o) => { return o.userTypeLinkId })
            .value();

        userList = userList.filter((e, i) => { return (userMemberListIds).indexOf(e.id) === -1 });

        let teamList = _(teams.List)
            .map((e, i) => { return { id: e.id, name: e.team } })
            .orderBy(['name'])
            .value();


        let teamMemberListIds = _(members.List)
            .filter((o) => { return o.usersType == 'team' })
            .map((o) => { return o.userTypeLinkId })
            .value();
        teamList = teamList.filter((e, i) => { return (teamMemberListIds).indexOf(e.id) === -1 });

        let memberList = (members.Selected.type == 'team') ? teamList : (members.Selected.type == 'users') ? userList : [];

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" onClick={this.handleSubmit} >
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