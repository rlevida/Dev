import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, postData, showToast } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        teams: store.teams,
        notes: store.notes,
        loggedUser: store.loggedUser
    }
})

export default class ConversationForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "fetchUsers",
            "getUsers",
            "setDropDownMultiple",
            "handleChange",
            "handleSubmit"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        this.fetchUsers();
    }

    fetchUsers(options) {
        const { dispatch } = this.props;
        let fetchUrl = "/api/user?page=1";

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

    getUsers(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchUsers(options);
        }, 1500);
    }

    setDropDownMultiple(name, values) {
        const { dispatch, teams } = this.props
        const selected = { ...teams.Selected, [name]: values };
        dispatch({ type: "SET_NOTES_SELECTED", Selected: selected })
    }

    handleChange(e) {
        const { dispatch, notes } = this.props
        const { Selected } = notes;
        dispatch({ type: "SET_NOTES_SELECTED", Selected: { ...Selected, [e.target.name]: e.target.value } });
    }

    handleSubmit() {
        const { dispatch, notes, loggedUser } = this.props
        const { Selected } = notes;
        const submitData = {
            note: Selected.message,
            receivers: _.map(Selected.users, (user) => { return user.value }),
            sender: loggedUser.data.id
        };

        postData(`/api/conversation/message`, submitData, (c) => {

        });
    }

    render() {
        const { teams, notes } = this.props;
        // const { notes, setIsClosed, loggedUser, global, workstreamId } = { ...this.props }
        // const { notesState, commentText } = { ...this.state }
        // const { specificClient } = { ...notesState }
        // const data = notes.Selected;

        // const clientUser = [];
        // global.SelectList.projectMemberList.map((e) => {
        //     if (e.userType === 'External') {
        //         clientUser.push({ id: e.id, name: `${e.firstName} ${e.lastName}` })
        //     }
        // })

        // let tagOptions = [];
        // if (typeof global.SelectList.workstreamList != "undefined" && typeof global.SelectList.taskList != "undefined") {
        //     global.SelectList.workstreamList
        //         .map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
        //     global.SelectList.taskList
        //         .filter(e => { return e.status != "Completed" })
        //         .map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })
        // }

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a class="text-white mr10">
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Send New Message
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class='col-lg-4 col-lg-push-8'>
                                </div>
                                <div class='col-lg-8 col-lg-pull-4'>
                                    <form id="conversation-form" class="full-form">
                                        <div class="form-group">
                                            <label for="project-type">Send a message to:</label>
                                            <DropDown
                                                multiple={true}
                                                required={true}
                                                options={teams.MemberList}
                                                onInputChange={this.getUsers}
                                                selected={(typeof notes.Selected.users == "undefined") ? [] : notes.Selected.users}
                                                placeholder={"Search users"}
                                                onChange={(e) => {
                                                    this.setDropDownMultiple("users", (e == null) ? [] : e);
                                                }}
                                                isClearable={((teams.MemberList).length > 0)}
                                            />
                                        </div>
                                        <div class="form-group">
                                            <label for="project-type">Send a message to:</label>
                                            <textarea
                                                name="message"
                                                value={(typeof notes.Selected.message == "undefined" || notes.Selected.message == null) ? "" : notes.Selected.message}
                                                class="form-control"
                                                placeholder="Type your message"
                                                onChange={this.handleChange}
                                            />
                                        </div>
                                        <a class="btn btn-violet mr5" onClick={this.handleSubmit}><span>Send Message</span></a>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}