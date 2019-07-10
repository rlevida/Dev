import React from "react";
import moment from "moment";
import _ from "lodash";
import { connect } from "react-redux";
import Mark from "mark.js";
import { Loading } from "../../globalComponents";
import { showToast, getData, postData, getParameterByName } from "../../globalFunction";

let keyTimer = "";
let filterCount = 0;

@connect(store => {
    return {
        notes: store.notes,
        loggedUser: store.loggedUser
    };
})
export default class ConversationList extends React.Component {
    constructor(props) {
        super(props);

        _.map(["fetchNotes", "getNextResult", "handleChange", "clearSearch", "starredTask", "openMessage", "clearMessage"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidUpdate(prevProps) {
        const { notes } = { ...this.props };
        if (_.isEqual(prevProps.notes.Filter, notes.Filter) == false) {
            this.fetchNotes(1);
        }
    }

    componentDidMount() {
        const noteId = getParameterByName("note-id");
        if (noteId != null) {
            this.getConversationById(noteId);
        }
        this.fetchNotes(1);
    }

    getConversationById(id) {
        const { loggedUser } = { ...this.props };
        let requestUrl = `/api/conversation/conversationById?noteId=${id}&starredUser=${loggedUser.data.id}&userId=${loggedUser.data.id}`;
        getData(requestUrl, {}, c => {
            this.openMessage(c.data);
        });
    }

    fetchNotes(page) {
        const { projectId, dispatch, notes, loggedUser, workstreamId } = { ...this.props };
        const { List, Filter } = notes;
        let requestUrl = `/api/conversation/conversationNotes?page=${page}&starredUser=${loggedUser.data.id}&userId=${loggedUser.data.id}`;

        if (workstreamId != "") {
            requestUrl += `&workstreamId=${workstreamId}`;
        }
        if (projectId != "") {
            requestUrl += `&projectId=${projectId}`;
        }
        if (Filter.title != "") {
            requestUrl += `&title=${Filter.title}`;
        }
        if (Filter.message != "") {
            requestUrl += `&message=${Filter.message}`;
        }

        getData(requestUrl, {}, c => {
            const messageList = page == 1 ? c.data.result : [...List, ...c.data.result];
            dispatch({ type: "SET_NOTES_LIST", list: messageList, count: c.data.count });
            dispatch({ type: "SET_NOTES_LOADING", Loading: "" });
        });
    }

    getNextResult() {
        const { notes, dispatch } = { ...this.props };
        const { Count } = notes;

        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        this.fetchNotes(Count.current_page + 1);
    }

    handleChange(e) {
        const { dispatch, notes } = this.props;
        const { Filter } = notes;
        const value = e.target.value;
        if (typeof e.key != "undefined" && e.key === "Enter" && value != "" && Filter.title != value) {
            this.clearMessage();
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                dispatch({
                    type: "SET_NOTES_FILTER",
                    filter: {
                        title: value,
                        message: value
                    }
                });
            }, 500);
        } else if (typeof e.key != "undefined" && e.key === "Enter" && e.target.value === "" && Filter.title != e.target.value) {
            this.clearMessage();
        } else if (typeof e.key != "undefined" && e.key === "Enter" && e.target.value !== "" && Filter.title == e.target.value) {
            filterCount += 1;
            this.scrollView(Filter.title);
        }
    }

    clearMessage() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_NOTES_LIST", list: [] });
        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        dispatch({
            type: "SET_NOTES_FILTER",
            filter: {
                title: "",
                message: ""
            }
        });
        dispatch({ type: "SET_COMMENT_LIST", list: [], count: {} });
        dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
        dispatch({ type: "SET_NOTES_SELECTED", Selected: {} });
    }

    clearSearch() {
        this.clearMessage();
    }

    starredTask({ id, isStarred }) {
        const { loggedUser, dispatch, notes } = this.props;
        const { List } = notes;
        const isStarredValue = isStarred > 0 ? 0 : 1;
        postData(
            `/api/starred/`,
            {
                linkType: "notes",
                linkId: id,
                usersId: loggedUser.data.id
            },
            c => {
                _.find(List, { id: id }).isStarred = isStarredValue;
                dispatch({ type: "SET_NOTES_LIST", list: List });
                showToast("success", `Message successfully ${isStarredValue > 0 ? "starred" : "unstarred"}.`);
            }
        );
    }

    openMessage({ note, id, noteWorkstream, notesTagTask, privacyType, createdBy, projectId }) {
        const { dispatch, notes, loggedUser } = { ...this.props };
        const { id: noteId = 0 } = notes.Selected;

        if (id != noteId) {
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({
                type: "SET_NOTES_SELECTED",
                Selected: {
                    title: note,
                    id,
                    privacyType,
                    createdBy,
                    workstream: noteWorkstream ? noteWorkstream : "",
                    workstreamId: noteWorkstream ? noteWorkstream.id : "",
                    users: _.map(notesTagTask, ({ user }) => {
                        return { value: user.id, label: user.firstName + " " + user.lastName, avatar: user.avatar };
                    }),
                    notesTagTask
                }
            });

            let requestUrl = `/api/conversation/getConversationList?linkType=notes&linkId=${id}`;

            getData(requestUrl, {}, c => {
                dispatch({ type: "SET_COMMENT_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
                if (notes.Filter.message !== "") {
                    this.highlight(notes.Filter.message);
                }
            });

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                postData(
                    `/api/conversation/seen`,
                    {
                        noteId: id,
                        projectId: noteWorkstream ? noteWorkstream.project.id : projectId,
                        usersId: loggedUser.data.id
                    },
                    c => {}
                );
            }, 1500);
        }
    }

    highlight(text) {
        const instance = new Mark(document.querySelector("#message-thread"));
        instance.mark(text, {
            accuracy: {
                value: "partially",
                limiters: [".", ",", "!"]
            },
            background: "orange"
        });
    }

    scrollView() {
        const { dispatch, notes } = this.props;
        const { Filter } = notes;
        const el = document.getElementsByClassName(Filter.title)[filterCount];
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    }

    render() {
        const { notes } = { ...this.props };
        const { List, Count, Filter, Selected } = notes;
        const { id: selectedNoteId = 0 } = Selected;
        const currentPage = typeof Count.current_page != "undefined" ? Count.current_page : 1;
        const lastPage = typeof Count.last_page != "undefined" ? Count.last_page : 1;
        const conversationList = _(List)
            .sortBy("dateAdded")
            .reverse()
            .value();

        return (
            <div id="message_list">
                <div class="mb20 display-flex">
                    <input type="text" name="title" class="form-control" placeholder="Search message" onKeyPress={this.handleChange} />
                    {Filter.title && Filter.message && (
                        <a class="logo-action text-grey" onClick={this.clearSearch}>
                            <i class="fa fa-times-circle-o ml5" aria-hidden="true" />
                        </a>
                    )}
                </div>
                <div class={`pd10 ${notes.Loading == "RETRIEVING" && notes.List.length == 0 ? "linear-background" : ""}`}>
                    {conversationList.length > 0 && (
                        <div id="messages">
                            {_.map(conversationList, (params, index) => {
                                const { id, note, noteWorkstream, isStarred, privacyType } = { ...params };
                                return (
                                    <div key={index} class={`message-div bb display-flex ${selectedNoteId == id ? "div-active" : ""}`}>
                                        <a class="logo-action text-grey" onClick={() => this.starredTask({ id, isStarred })}>
                                            <i title="FAVORITE" class={`fa ${isStarred ? "fa-star text-yellow" : "fa-star-o"}`} aria-hidden="true" />
                                        </a>
                                        <a
                                            onClick={() => {
                                                this.openMessage(params);
                                            }}
                                        >
                                            <div>
                                                <p class="note mb0">{noteWorkstream ? noteWorkstream.workstream : ""}</p>
                                                <h3>{note}</h3>
                                            </div>
                                        </a>
                                        <span title={privacyType.toUpperCase()} class="flex-right">
                                            <i class={`fa ${privacyType == "Private" ? "fa-lock" : "fa-globe"} text-grey`} aria-hidden="true" />
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {notes.Loading == "RETRIEVING" && List.length > 0 && <Loading />}
                    {currentPage != lastPage && notes.Loading != "RETRIEVING" && (
                        <p class="mb0 text-center">
                            <a onClick={() => this.getNextResult()}>Load More Messages</a>
                        </p>
                    )}
                    {List.length == 0 && notes.Loading != "RETRIEVING" && (
                        <p class="mb0 text-center">
                            <strong>No Records Found</strong>
                        </p>
                    )}
                </div>
            </div>
        );
    }
}
