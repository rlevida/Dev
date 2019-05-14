import React from "react";
import moment from "moment";
import _ from "lodash";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { showToast, getData, postData, getParameterByName } from "../../globalFunction";

let keyTimer = "";

@connect(store => {
    return {
        notes: store.notes,
        loggedUser: store.loggedUser
    };
})
export default class ConversationList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "fetchNotes",
            "getNextResult",
            "handleChange",
            "clearSearch",
            "starredTask",
            "openMessage"
        ], (fn) => {
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
            this.getConversationById(noteId)
        }
        this.fetchNotes(1);
    }

    getConversationById(id) {
        const { loggedUser } = { ...this.props }
        let requestUrl = `/api/conversation/conversationById?noteId=${id}&starredUser=${loggedUser.data.id}&userId=${loggedUser.data.id}`;
        getData(requestUrl, {}, (c) => {
            this.openMessage(c.data)
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

        getData(requestUrl, {}, (c) => {
            const messageList = (page == 1) ? c.data.result : [...List, ...c.data.result];
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

        if ((typeof e.key != "undefined" && e.key === 'Enter' && e.target.value != "") && Filter.title != e.target.value) {
            dispatch({ type: "SET_NOTES_LIST", list: [] });
            dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
            dispatch({
                type: "SET_NOTES_FILTER", filter: {
                    title: e.target.value
                }
            });
        }
    }

    clearSearch() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_NOTES_LIST", list: [] });
        dispatch({ type: "SET_NOTES_FILTER", filter: { title: "" } });
    }

    starredTask({ id, isStarred }) {
        const { loggedUser, dispatch, notes } = this.props;
        const { List } = notes;
        const isStarredValue = (isStarred > 0) ? 0 : 1;
        postData(`/api/starred/`, {
            linkType: "notes",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            _.find(List, { id: id }).isStarred = isStarredValue
            dispatch({ type: "SET_NOTES_LIST", list: List });
            showToast("success", `Message successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
        });
    }

    openMessage({ note, id, noteWorkstream, notesTagTask, privacyType, createdBy }) {
        const { dispatch, notes, loggedUser } = { ...this.props };
        const { id: noteId = 0 } = notes.Selected;

        if (id != noteId) {
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({
                type: "SET_NOTES_SELECTED", Selected: {
                    title: note,
                    id,
                    privacyType,
                    createdBy,
                    workstream: noteWorkstream,
                    workstreamId: noteWorkstream.id,
                    users: _.map(notesTagTask, ({ user }) => {
                        return { value: user.id, label: user.firstName + " " + user.lastName, avatar: user.avatar }
                    }),
                    notesTagTask
                }
            });

            getData(`/api/conversation/getConversationList?page=1&linkType=notes&linkId=${id}`, {}, (c) => {
                dispatch({ type: "SET_COMMENT_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
            });

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                postData(`/api/conversation/seen`, {
                    noteId: id,
                    projectId: noteWorkstream.project.id,
                    usersId: loggedUser.data.id
                }, (c) => {

                });
            }, 1500);

        }
    }

    render() {
        const { notes } = { ...this.props };
        const { List, Count, Filter, Selected } = notes;
        const { id: selectedNoteId = 0 } = Selected;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        const conversationList = _(List)
            .sortBy('dateAdded')
            .reverse()
            .value();

        return (
            <div id="message_list">
                <div class="mb20 display-flex">
                    <input
                        type="text"
                        name="search"
                        class="form-control"
                        placeholder="Search topic"
                        onKeyPress={this.handleChange}
                    />
                    {
                        (typeof Filter.title != "undefined" && Filter.title != "") && <a
                            class="logo-action text-grey"
                            onClick={this.clearSearch}
                        >
                            <i class="fa fa-times-circle-o ml5" aria-hidden="true"></i>
                        </a>
                    }
                </div>
                <div class={`pd10 ${(notes.Loading == "RETRIEVING" && (notes.List).length == 0) ? "linear-background" : ""}`}>
                    {
                        (conversationList.length > 0) && <div id="messages">
                            {
                                _.map(conversationList, (params, index) => {
                                    const { id, note, noteWorkstream, isStarred, privacyType } = { ...params };
                                    return (
                                        <div key={index} class={`message-div bb display-flex ${(selectedNoteId == id) ? "div-active" : ""}`}>
                                            <a class="logo-action text-grey" onClick={() => this.starredTask({ id, isStarred })}>
                                                <i title="FAVORITE" class={`fa ${isStarred ? "fa-star text-yellow" : "fa-star-o"}`} aria-hidden="true"></i>
                                            </a>
                                            <a onClick={() => { this.openMessage(params) }}>
                                                <div>
                                                    <p class="note mb0">{noteWorkstream.workstream}</p>
                                                    <h3>{note}</h3>
                                                </div>
                                            </a>
                                            <span title={(privacyType).toUpperCase()} class="flex-right">
                                                <i class={`fa ${(privacyType == "Private") ? "fa-lock" : "fa-globe"} text-grey`} aria-hidden="true"></i>
                                            </span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    }
                    {
                        (notes.Loading == "RETRIEVING" && (List).length > 0) && <Loading />
                    }
                    {
                        (currentPage != lastPage && notes.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Messages</a></p>
                    }
                    {
                        ((List).length == 0 && notes.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        );
    }
}
