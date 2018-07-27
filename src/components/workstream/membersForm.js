import React from "react"

import { showToast } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"

import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        users: store.users,
        members: store.members
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
        let { socket, members, workstream } = this.props
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

        if (_.has(members.Selected, 'userTypeLinkId') == false) {
            showToast("error", "No members remaining.")
            return;
        }

        socket.emit("SAVE_OR_UPDATE_MEMBERS", {
            data: {
                ...members.Selected,
                usersType: 'users',
                linkType: 'workstream',
                linkId: workstream.Selected.id
            }
        });
    }

    setDropDown(name, value) {
        let { dispatch, members } = this.props
        let Selected = Object.assign({}, members.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    render() {
        let { users, members } = this.props;
        let typeList = [
            { id: 'assignedTo', name: 'Assigned To' },
            { id: 'Follower', name: 'Follower' },
            { id: 'responsible', name: 'Responsible' },
        ];
        let userList = users.List.map((e, i) => { return { id: e.id, name: e.firstName + ' ' + e.lastName } });
        let memberListIds = members.List.map((o) => { return o.userTypeLinkId });
        userList = userList.filter((e, i) => { return (memberListIds).indexOf(e.id) === -1 });

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
                                <label class="col-md-3 col-xs-12 control-label">Member</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={userList}
                                        selected={(typeof members.Selected.userTypeLinkId == "undefined" || userList.length == 0) ? "" : members.Selected.userTypeLinkId}
                                        onChange={(e) => {
                                            this.setDropDown("userTypeLinkId", e.value);
                                        }}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Type</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={typeList}
                                        selected={(typeof members.Selected.memberType == "undefined") ? "" : members.Selected.memberType}
                                        onChange={(e) => {
                                            this.setDropDown("memberType", e.value);
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