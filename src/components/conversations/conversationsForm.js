import React from "react";
import _ from 'lodash';
import moment from 'moment';
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, postData, showToast } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        teams: store.teams,
        notes: store.notes,
        workstream: store.workstream,
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
            "handleSubmit",
            "setWorkstreamList",
            "fetchWorkstreamList",
            "handleFile",
            "removefile"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        this.fetchUsers();
        this.fetchWorkstreamList();
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
        const { dispatch, notes } = this.props
        const selected = { ...notes.Selected, [name]: values };
        dispatch({ type: "SET_NOTES_SELECTED", Selected: selected })
    }

    setDropDown(name, value) {
        const { dispatch, notes } = { ...this.props };
        const { Selected } = notes;
        dispatch({ type: "SET_NOTES_SELECTED", Selected: { ...Selected, [name]: value } });
    }

    handleChange(e) {
        const { dispatch, notes } = { ...this.props };
        const { Selected } = notes;
        dispatch({ type: "SET_NOTES_SELECTED", Selected: { ...Selected, [e.target.name]: e.target.value } });
    }

    handleSubmit() {
        const { dispatch, notes, loggedUser, projectId } = { ...this.props };
        const { Selected } = notes;

        postData(`/api/conversation/message`, { ...Selected, projectId, userId: loggedUser.data.id }, (c) => {

        });
    }

    setWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchWorkstreamList(options) {
        const { projectId, loggedUser, dispatch } = { ...this.props };
        let fetchUrl = `/api/workstream?projectId=${projectId}&page=1&userId=${loggedUser.data.id}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&workstream=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const workstreamOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.workstream } })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    handleFile(e) {
        const { dispatch, notes } = { ...this.props };
        const { Selected } = notes;
        const selectedFiles = (typeof Selected.files != "undefined") ? Selected.files : [];
        const files = _.map(this.refs.fileUploader.files, (o) => {
            return o;
        });
        dispatch({ type: "SET_NOTES_SELECTED", Selected: { ...Selected, files: [...selectedFiles, ...files] } });
    }

    removefile(selecindextedId) {
        const { dispatch, notes } = { ...this.props };
        const { Selected } = notes;
        (Selected.files).splice(selecindextedId, 1);
        dispatch({ type: "SET_NOTES_SELECTED", Selected: { ...Selected, files: Selected.files } });
    }

    render() {
        const { teams, workstream, notes } = this.props;
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
            <div>
                <form id="conversation-form" class="full-form">
                    <div class="form-group" class="mb0" id="chat-title">
                        <input
                            type="text"
                            name="title"
                            required
                            value={(typeof notes.Selected.title == "undefined") ? "" : notes.Selected.title}
                            id="message-title"
                            class="form-control underlined"
                            placeholder="Type a title"
                            onChange={this.handleChange}
                        />
                        <a class="logo-action text-grey"><i title="PRIVATE" class="fa fa-lock" aria-hidden="true"></i></a>
                    </div>
                    <div id="chat-area">
                        <div class="form-group">
                            <DropDown
                                required={true}
                                options={workstream.SelectList}
                                onInputChange={this.setWorkstreamList}
                                selected={(typeof notes.Selected.workstreamId == "undefined") ? "" : notes.Selected.workstreamId}
                                onChange={(e) => {
                                    this.setDropDown("workstreamId", (e == null) ? "" : e.value);
                                }}
                                placeholder={'Select workstream'}
                            />
                        </div>
                        <div id="message-thread">
                            <i class="fa fa-envelope-o" aria-hidden="true"></i>
                        </div>
                        <div>
                            <input type="file" id="message-file" ref="fileUploader" style={{ display: "none" }} multiple onChange={this.handleFile} />
                        </div>
                        <div class="form-group" id="message-div">
                            <textarea
                                name="message"
                                value={(typeof notes.Selected.message == "undefined" || notes.Selected.message == null) ? "" : notes.Selected.message}
                                class="form-control"
                                placeholder="Message"
                                onChange={this.handleChange}
                            />
                            <a class="logo-action text-grey" onClick={() => this.refs.fileUploader.click()}>
                                <i class="fa fa-paperclip" aria-hidden="true"></i>
                            </a>
                        </div>
                        {
                            (typeof notes.Selected.files != "undefined" && (notes.Selected.files).length > 0) && <div>
                                <label>
                                    Attachments:
                                                </label>
                                {
                                    _.map(notes.Selected.files, ({ name, id }, index) => {
                                        return (
                                            <div class="file-div" key={index}>
                                                <p class="m0"><strong>{name.substring(0, 30)}{(name.length > 30) ? "..." : ""}</strong></p>
                                                <a onClick={() => this.removefile(index)}><i class="fa fa-times ml10" aria-hidden="true"></i></a>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        }
                        <div class="form-group mb0">
                            <label for="project-type">People:</label>
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
                        <a class="btn btn-violet mt10" onClick={this.handleSubmit} disabled={(notes.Loading == "SUBMITTING")}>
                            <span>
                                Send
                            </span>
                        </a>
                    </div>
                </form>
            </div>
        )
    }
}