import React from "react";
import _ from 'lodash';
import moment from 'moment';
import { connect } from "react-redux";

import { DropDown, Loading } from "../../globalComponents";
import { getData, postData, putData, showToast } from "../../globalFunction";

import DocumentViewerModal from "../document/modal/documentViewerModal";

let keyTimer = "";

@connect((store) => {
    return {
        teams: store.teams,
        notes: store.notes,
        conversation: store.conversation,
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
            "removefile",
            "fetchConversation",
            "handleEditTitle",
            "updateMessage"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
        this.myRef = null
    }

    componentDidMount() {
        this.fetchUsers();
        this.fetchWorkstreamList();
    }

    componentDidUpdate(prevProps) {
        if ((prevProps.conversation.List).length != (this.props.conversation.List).length && this.props.conversation.Count.current_page == 1) {
            this.scrollToBottom();
        }

        if ((prevProps.conversation.List).length != (this.props.conversation.List).length) {
            this.refs.fileUploader.value = "";
        }
    }

    scrollToBottom() {
        this.newData.scrollIntoView({ behavior: "smooth" })
    };

    fetchUsers(options) {
        const { dispatch, projectId } = this.props;
        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${projectId}&linkType=project`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const taskMemberOptions = _(c.data)
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName, image: e.avatar } })
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
        const { dispatch, notes } = this.props;
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
        const { dispatch, notes, loggedUser, projectId, workstreamId } = { ...this.props };
        const { Selected, List } = notes;
        let data = new FormData();

        if (typeof Selected.id != "undefined" && Selected.id != "") {
            const messageObj = {
                comment: Selected.message,
                usersId: loggedUser.data.id,
                workstreamId: (workstreamId != "") ? workstreamId : Selected.workstreamId,
                linkType: "notes",
                linkId: Selected.id,
                users: Selected.users
            };
            if (typeof Selected.files != "undefined" && (Selected.files).length > 0) {
                _.map(Selected.files, (file) => {
                    data.append("file", file);
                });
            }
            data.append("body", JSON.stringify(messageObj));
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });
            postData(`/api/conversation?projectId=${projectId}`, data, (c) => {
                const conversationNotes = c.data.conversationNotes;
                const { note, id, noteWorkstream, notesTagTask, createdBy } = conversationNotes;
                const noteIndex = _.findIndex(notes.List, { id: conversationNotes.id });

                (notes.List).splice(noteIndex, 1, conversationNotes);

                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
                dispatch({ type: "SET_NOTES_LIST", list: notes.List });
                dispatch({ type: "ADD_COMMENT_LIST", list: c.data });
                dispatch({
                    type: "SET_NOTES_SELECTED", Selected:
                    {
                        title: note,
                        id,
                        workstream: noteWorkstream,
                        workstreamId: noteWorkstream.id,
                        users: _.map(notesTagTask, ({ user }) => {
                            return { value: user.id, label: user.firstName + " " + user.lastName, avatar: user.avatar }
                        }),
                        notesTagTask,
                        message: "",
                        createdBy
                    }
                });

                this.scrollToBottom();
            });
        } else {
            if (typeof Selected.files != "undefined" && (Selected.files).length > 0) {
                _.map(Selected.files, (file) => {
                    data.append("file", file);
                });
            }
            data.append("body", JSON.stringify({
                ...Selected,
                projectId,
                userId: loggedUser.data.id,
                workstreamId: (workstreamId != "") ? workstreamId : Selected.workstreamId
            })
            );
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });
            postData(`/api/conversation/message`, data, (c) => {
                const selectedNote = c.data[0];
                const { note, id, noteWorkstream, notesTagTask, comments } = selectedNote;

                dispatch({ type: "SET_NOTES_LIST", list: [...List, ...c.data] });
                dispatch({
                    type: "SET_NOTES_SELECTED", Selected:
                    {
                        title: note,
                        id,
                        workstream: noteWorkstream,
                        workstreamId: noteWorkstream.id,
                        users: _.map(notesTagTask, ({ user }) => {
                            return { value: user.id, label: user.firstName + " " + user.lastName, avatar: user.avatar }
                        }),
                        notesTagTask,
                        message: ""
                    }
                });

                dispatch({ type: "SET_COMMENT_LIST", list: comments, count: { total_count: 1, current_page: 1, last_page: 1 } });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
            });
        }
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

    handleFile() {
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

    fetchConversation() {
        const { dispatch, notes, conversation } = { ...this.props };
        let requestUrl = `/api/conversation/getConversationList?page=${conversation.Count.current_page + 1}&linkType=notes&linkId=${notes.Selected.id}`;

        dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });

        getData(requestUrl, {}, (c) => {
            dispatch({ type: "SET_COMMENT_LIST", list: [...conversation.List, ...c.data.result], count: c.data.count });
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
        });
    }

    handleEditTitle() {
        const { dispatch, notes } = { ...this.props };
        dispatch({
            type: "SET_NOTES_SELECTED", Selected: {
                ...notes.Selected,
                editTitle: (typeof notes.Selected.editTitle == "undefined") ? true : !notes.Selected.editTitle
            }
        });
        setTimeout(() => {
            this.myTextInput.focus();
            this.myTextInput.select();
        }, 100);

    }

    updateMessage() {
        const { dispatch, notes } = { ...this.props };
        const { id, title, privacyType } = notes.Selected;
        const noteList = notes.List;
        const newprivacyType = (privacyType == "Private") ? "Public" : "Private";

        putData(`/api/conversation/${id}`, { note: title, privacyType: newprivacyType }, (c) => {
            const noteIndex = _.findIndex(noteList, { id });
            const updatedObject = _.merge(noteList[noteIndex], { note: title, privacyType: newprivacyType });
            noteList.splice(noteIndex, 1, updatedObject);

            dispatch({ type: "SET_NOTES_LIST", list: noteList });
            dispatch({
                type: "SET_NOTES_SELECTED",
                Selected: {
                    ...notes.Selected,
                    privacyType: newprivacyType,
                    editTitle: false
                }
            });
            showToast("success", "Message successfully updated.");
        });
    }

    viewDocument(data) {
        const { dispatch, loggedUser } = { ...this.props };
        if (data.document_read.length === 0) {
            const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 };
            postData(`/api/document/read`, dataToSubmit, (ret) => {
                dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: { ...data, document_read: [ret.data], isRead: 1 } });
                $(`#documentViewerModal`).modal('show')
            });
        } else {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
            $(`#documentViewerModal`).modal('show')
        }
    }

    render() {
        const { teams, workstream, notes, conversation, loggedUser, workstreamId } = this.props;
        const workstreamList = workstream.SelectList;
        const userList = [...teams.MemberList, ..._.map(notes.Selected.users, ({ value, label }) => { return { id: value, name: label } })];
        const conversationList = (typeof notes.Selected.id != "undefined" && notes.Selected.id != "") ? _(conversation.List)
            .filter((o) => { return o.linkType == "notes" && o.linkId == notes.Selected.id })
            .sortBy('dateAdded')
            .value()
            : [];
        const currentConversationPage = (typeof conversation.Count.current_page != "undefined") ? conversation.Count.current_page : 1;
        const lastConversationPage = (typeof conversation.Count.last_page != "undefined") ? conversation.Count.last_page : 1;

        if (typeof notes.Selected.id != "undefined" && notes.Selected.id != "") {
            workstreamList.push({
                id: notes.Selected.workstream.id,
                name: notes.Selected.workstream.workstream
            });
        }

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
                            ref={(input) => { this.myTextInput = input; }}
                            disabled={(
                                (typeof notes.Selected.editTitle == "undefined" || notes.Selected.editTitle == false) &&
                                (typeof notes.Selected.id != "undefined" && notes.Selected.id != "")
                            )}
                        />
                        <div class="form-action">
                            {
                                (
                                    typeof notes.Selected.id != "undefined" && notes.Selected.id != "" &&
                                    (typeof notes.Selected.editTitle != "undefined" && notes.Selected.editTitle)
                                ) && <a
                                    onClick={this.updateMessage}
                                    class="logo-action text-grey mr10"
                                ><i title="SAVE TITLE" class="fa fa-check" aria-hidden="true"></i></a>
                            }
                            {
                                (
                                    typeof notes.Selected.id != "undefined" && notes.Selected.id != "" &&
                                    (typeof notes.Selected.editTitle == "undefined" || notes.Selected.editTitle == false)
                                ) && <div>
                                    <a href="javascript:void(0);" class="btn btn-action dropdown-toggle m0" type="button" data-toggle="dropdown"><span class="fa fa-ellipsis-v" title="Settings"></span></a>
                                    <ul class="dropdown-menu pull-right">
                                        <li><a onClick={this.handleEditTitle}>Edit Title</a></li>
                                        <li><a onClick={this.updateMessage}>Make {(notes.Selected.privacyType == "Private") ? "Public" : "Private"}</a></li>
                                    </ul>
                                </div>
                            }
                        </div>
                    </div>
                    <div id="chat-area">
                        <div class={`form-group ${(typeof notes.Selected.id != "undefined" && notes.Selected.id != "") ? "pointer-none" : ""}`}>
                            <DropDown
                                required={true}
                                options={_.uniqBy(workstreamList, 'id')}
                                onInputChange={this.setWorkstreamList}
                                selected={(typeof notes.Selected.workstreamId == "undefined" && workstreamId == "") ? "" : (workstreamId != "") ? workstreamId : notes.Selected.workstreamId}
                                onChange={(e) => {
                                    this.setDropDown("workstreamId", (e == null) ? "" : e.value);
                                }}
                                disabled={(workstreamId != "")}
                                placeholder={'Select workstream'}
                            />
                        </div>
                        <div
                            id="message-thread"
                            class={(conversationList.length == 0) ? "display-flex origin-center" : ""}>
                            {
                                (currentConversationPage != lastConversationPage && conversation.Loading != "RETRIEVING" && _.isEmpty(notes.Selected) == false) && <p class="text-center mb15"><a onClick={this.fetchConversation}>Load More Message</a></p>
                            }
                            {
                                (conversation.Loading == "RETRIEVING" && (conversationList).length > 0) && <div class="mb10"><Loading /></div>
                            }
                            {
                                (conversationList.length == 0) && <i class="fa fa-envelope-o" aria-hidden="true"></i>
                            }
                            {
                                (conversationList.length > 0) && <div>
                                    {
                                        _.map(conversationList, ({ comment, users, dateAdded, conversationDocuments }, index) => {
                                            const duration = moment.duration(moment().diff(moment(dateAdded)));
                                            const date = (duration.asDays() > 1) ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
                                            return (
                                                <div class="thread" key={index} ref={(ref) => this.newData = ref}  >
                                                    <div class="thumbnail-profile">
                                                        <img src={users.avatar} alt="Profile Picture" class="img-responsive" />
                                                    </div>
                                                    <div class="message-text">
                                                        <p class="note mb5"><strong>{users.firstName + " " + users.lastName}</strong> {date}</p>
                                                        <p>{comment}</p>
                                                        {
                                                            (conversationDocuments.length > 0) && _.map(conversationDocuments, ({ document }, index) => {
                                                                return (
                                                                    <p class="ml10" key={index}>
                                                                        <i class="fa fa-file mr5" aria-hidden="true"></i>
                                                                        <a href="javascript:void(0)" onClick={() => this.viewDocument(document)}>{(document.origin).substring(0, 50)}{((document.origin).length > 50) ? "..." : ""}</a>
                                                                    </p>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            }
                        </div>
                        <div>
                            <input accept=".jpg,.png,.pdf,.doc,.docx,.xlsx"
                                type="file"
                                id="message-file"
                                ref="fileUploader"
                                style={{ display: "none" }}
                                multiple
                                onChange={this.handleFile}
                            />
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
                            <div class="display-flex mb10">
                                {
                                    _.map(notes.Selected.notesTagTask, ({ user }, index) => {
                                        return (
                                            <div class="thumbnail-profile" key={index}>
                                                <span title={user.firstName + " " + user.lastName}>
                                                    <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                </span>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            {
                                (typeof notes.Selected.createdBy == "undefined" || notes.Selected.createdBy == loggedUser.data.id) && <DropDown
                                    multiple={true}
                                    required={true}
                                    options={
                                        _(userList)
                                            .uniqBy('id')
                                            .filter((o) => {
                                                return o.id != loggedUser.data.id
                                            })
                                            .value()
                                    }
                                    onInputChange={this.getUsers}
                                    selected={(typeof notes.Selected.users == "undefined") ? [] : notes.Selected.users}
                                    placeholder={"Search users"}
                                    onChange={(e) => {
                                        this.setDropDownMultiple("users", (e == null) ? [] : e);
                                    }}
                                    customLabel={(o) => {
                                        return (
                                            <div class="drop-profile">
                                                {
                                                    (o.image != "") && <img src={o.image} alt="Profile Picture" class="img-responsive" />
                                                }
                                                <p class="m0">{o.label}</p>
                                            </div>
                                        );
                                    }}
                                    customSelected={({ value: o }) => {
                                        return (
                                            <div class="drop-profile">
                                                {
                                                    (o.image != "") && <img src={o.image} alt="Profile Picture" class="img-responsive" />
                                                }
                                                <p class="m0">{o.label}</p>
                                                <span class="Select-value-icon close-custom" aria-hidden="true" onClick={() => {
                                                    const updatedList = _.remove(notes.Selected.users, ({ value }) => { return value != o.value });
                                                    this.setDropDownMultiple("users", updatedList);
                                                }}>
                                                    ×
                                                </span>
                                            </div>
                                        );
                                    }}
                                    isClearable={((teams.MemberList).length > 0)}
                                />
                            }
                        </div>
                        {
                            (
                                (typeof notes.Selected.title != "undefined" && notes.Selected.title != "") &&
                                (
                                    (typeof notes.Selected.workstreamId != "undefined" && notes.Selected.workstreamId != "") ||
                                    workstreamId != ""
                                ) &&
                                (typeof notes.Selected.message != "undefined" && notes.Selected.message != null && notes.Selected.message != "") &&
                                (typeof notes.Selected.users != "undefined" && (notes.Selected.users).length > 0) && <a disabled={(conversation.Loading == "SUBMITTING")} class="btn btn-violet mt10" onClick={this.handleSubmit}>

                                    <span>
                                        {
                                            (conversation.Loading == "SUBMITTING") ? "Sending..." : "Send"
                                        }
                                    </span>
                                </a>
                            )
                        }
                    </div>
                </form>
                <DocumentViewerModal />
            </div>
        )
    }
}