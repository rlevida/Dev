import React from "react";
import moment from "moment";
import { connect } from "react-redux";
import parallel from 'async/parallel';
import _ from "lodash";
import { getData, putData, showToast, postData } from "../../globalFunction";
import { Loading, HeaderButtonContainer } from "../../globalComponents";
import Modal from "./newForm";

@connect(store => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        task: store.task,
    };
})
export default class List extends React.Component {
    constructor(props) {
        super(props);
        this.fetchProjectMember = this.fetchProjectMember.bind(this);
        this.fetchNotes = this.fetchNotes.bind(this);
        this.fetchTags = this.fetchTags.bind(this)
        this.openDetail = this.openDetail.bind(this);
        this.updateStarred = this.updateStarred.bind(this);
    }

    componentDidMount() {
        this.fetchNotes();
        this.fetchProjectMember();
        this.fetchTags();
    }

    fetchTags() {
        const { dispatch, loggedUser } = this.props;
        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project}`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
        })
        getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project}`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
        })
    }

    fetchNotes() {
        const { dispatch, loggedUser, workstreamId } = this.props;
        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        let url = `/api/conversation?starredUser=${loggedUser.data.id}&projectId=${project}&userId=${loggedUser.data.id}`
        if (workstreamId) {
            url = `${url}&workstreamId=${workstreamId}`
        }
        getData(url, {}, c => {
            dispatch({ type: "SET_NOTES_LIST", list: c.data });
            if (conversationId !== '') {
                const selectedNote = c.data.filter((e) => { return e.id == conversationId })
                if (selectedNote.length > 0) {
                    this.openDetail(selectedNote[0])
                }
            }
            dispatch({ type: "SET_NOTES_LOADING", Loading: "" });
        });
    }

    fetchProjectMember() {
        const { dispatch } = this.props;
        getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
        })
    }

    openDetail(data) {
        const { dispatch, loggedUser } = this.props;
        const unseenComments = data.comments.filter((e) => { return !e.seenComments.length }).map((e) => { return e.id })
        parallel({
            notes: (parallelCallback) => {
                postData(`/api/conversation/lastSeen?type=notes`, { projectId: project, userId: loggedUser.data.id, linkId: data.id, linkType: 'notes' }, (c) => {
                    parallelCallback(null)
                })
            },
            conversation: (parallelCallback) => {
                if (unseenComments.length > 0) {
                    postData(`/api/conversation/lastSeen?type=conversation`, { projectId: project, commentIds: unseenComments, userId: loggedUser.data.id }, (c) => {
                        parallelCallback(null)
                    })
                } else {
                    parallelCallback(null)
                }
            }
        }, (err, result) => {
            window.history.replaceState({}, document.title, "/project/" + `${project}/conversations/${data.id}`);
            dispatch({ type: "SET_NOTES_SELECTED", Selected: data });
            dispatch({ type: "SET_NOTES_FORM_ACTIVE", FormActive: "View" });
        })
    }

    renderStatus(data) {
        const { isActive, dueDate } = { ...data };
        const dueDateMoment = moment(dueDate);
        const currentDateMoment = moment(new Date());
        let taskStatus = 0;
        let statusColor = "#000";

        if (
            dueDateMoment.isBefore(currentDateMoment, "day") &&
            data.status != "Completed"
        ) {
            taskStatus = 2;
        } else if (
            dueDateMoment.isSame(currentDateMoment, "day") &&
            data.status != "Completed"
        ) {
            taskStatus = 1;
        }

        if (isActive == 0) {
        } else if (taskStatus == 0) {
            statusColor = "#27ae60";
        } else if (taskStatus == 1) {
            statusColor = "#f39c12";
        } else if (taskStatus == 2) {
            statusColor = "#c0392b";
        }

        return statusColor;
    }

    renderPrivacy(privacy) {
        let icon = "fa-users"; // public by default
        if (privacy === "email") {
            icon = "fa-envelope";
        } else if (privacy === "linked") {
            icon = "fa-link";
        } else if (privacy === "private") {
            icon = "fa-lock";
        }
        return icon;
    }

    updateStarred(event, data) {
        const { notes, dispatch, loggedUser } = this.props;
        const { id, isStarred } = { ...data };
        const isStarredValue = isStarred ? 0 : 1;

        postData(`/api/starred/`, {
            linkType: "notes",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const noteList = _.map([...notes.List], (noteObj, index) => {
                    if (id == noteObj.id) {
                        noteObj["isStarred"] = isStarredValue;
                    }
                    return noteObj;
                });
                dispatch({ type: "SET_NOTES_LIST", list: noteList });
                showToast("success", `Note successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });

        event.stopPropagation();
    }

    render() {
        const { notes, loggedUser, setIsClosed, workstreamId, task } = this.props;
        const currentPage =
            typeof notes.Count.current_page != "undefined"
                ? notes.Count.current_page
                : 1;
        const lastPage =
            typeof notes.Count.last_page != "undefined" ? notes.Count.last_page : 1;
        const notesList = notes.List;

        return (
            <div class="pd10">
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" onClick={() => $("#NewNoteModal").modal("show")}>
                        <span>New Notes</span>
                    </li>
                </HeaderButtonContainer>
                <Modal />
                <table id="dataTable" class="table responsive-table mt30">
                    <tbody>
                        {notesList.map(e => {
                            const lastCommentUser = e.comments[e.comments.length - 1];
                            // hide notes for client
                            if (e.accessType === "INTERNAL_ONLY" && loggedUser.data.userType === "External") {
                                return "";
                            }
                            if (e.accessType === 'SPECIFIC_CLIENT' && loggedUser.data.userType === "External") {
                                let hasAccess = false;

                                let specificUser = e.specificUser || '[]';
                                specificUser = (typeof specificUser === 'string') ? JSON.parse(specificUser) : specificUser;
                                specificUser.map((e) => {
                                    if (loggedUser.data.id === e.id) {
                                        hasAccess = true;
                                    }
                                })
                                if (!hasAccess) {
                                    return "";
                                }
                            }
                            return (
                                <tr
                                    key={`${e.id}-${new Date().getTime()}`}
                                    style={{
                                        cursor: "pointer",
                                        /*background:
                                          notes.Selected.id === e.id ? "#f5f5f5" : "transparent"*/
                                    }}
                                    onClick={() => this.openDetail(e)}
                                >
                                    <td style={{ width: "50px" }}>
                                        <div >
                                            <span class={`fa ${e.isStarred ? "fa-star" : "fa-star-o"} m10`} style={{ position: 'relative', display: 'block' }} />
                                            {(e.isSeen == 0) &&
                                                <span class={`fa fa-envelope`} style={{ position: 'relative', display: 'block' }} />
                                            }
                                        </div>
                                    </td>
                                    <td class="text-left">
                                        <div>
                                            <h5>{e.note}{(e.isClosed) ? <span class="label" style={{ margin: "5px", background: "red", color: "white" }}>CLOSED</span> : ""}</h5>
                                            {lastCommentUser &&
                                                <label style={{ fontWeight: "normal" }}>
                                                    {moment(lastCommentUser.dateAdded).format("MM/DD/YYYY hh:mm")}
                                                </label>
                                            }
                                            <div style={{ float: "right", marginTop: "-30px" }}>
                                                {e.tag.map(f => {
                                                    const color = (f.value.indexOf("task") > -1) ? "blue" : "green";
                                                    return (
                                                        <span
                                                            class="label"
                                                            style={{ margin: "5px", background: color }}
                                                        >
                                                            {f.label}
                                                        </span>
                                                    );
                                                })}
                                                {loggedUser.data.id === e.creator.id &&
                                                    <div class="dropdown" style={{ float: "right" }}>
                                                        <button style={{ padding: "3px", border: "none", paddingRight: "0px" }} class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" onClick={(e) => { e.stopPropagation() }} aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right document-actions" aria-labelledby="dropdownMenu2" >
                                                            {(e.isClosed === 1) &&
                                                                <li><a href="javascript:void(0)" onClick={() => setIsClosed(0, e)}>Open</a></li>
                                                            }
                                                            {(e.isClosed === 0) &&
                                                                <li><a href="javascript:void(0)" onClick={() => setIsClosed(1, e)}>Close</a></li>
                                                            }
                                                        </ul>
                                                    </div>
                                                }
                                            </div>
                                            <div style={{ float: "right" }}>
                                                {lastCommentUser &&
                                                    <i className={`fa fa-user`} title={`${lastCommentUser.users.firstName} ${lastCommentUser.users.lastName}`} style={{ paddingRight: "20px" }} />
                                                }
                                                <span
                                                    className={`fa ${this.renderPrivacy(e.privacyType)}`}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center" />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div class="text-center">
                    {notes.Loading == "RETRIEVING" && <Loading />}
                    {currentPage != lastPage && (
                        <a onClick={() => this.getNextResult()}>Load More Task</a>
                    )}
                    {notesList.length == 0 && notes.Loading != "RETRIEVING" && (
                        <p>No Records Found</p>
                    )}
                </div>
            </div>
        );
    }
}
