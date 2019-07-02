import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { MentionConvert } from "../../../globalComponents";
import { MentionsInput, Mention } from "react-mentions";
import moment from "moment";
import { postData, showToast, getData } from "../../../globalFunction";
import defaultStyle from "../../global/react-mention-style";
import { withRouter } from "react-router";
import { Loading } from "../../../globalComponents";

let keyTimer = "";

@connect(({ task, conversation, document, loggedUser, project }) => {
    return {
        task,
        conversation,
        document,
        loggedUser,
        project
    };
})
class DocumentComment extends React.Component {
    constructor(props) {
        super(props);
        _.map(["renderUsers", "handleSubmit", "handleChange", "replyComment", "getNextResult", "fetchData"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    replyComment({ firstName, lastName, username, id }) {
        const { dispatch, conversation } = this.props;
        const { Selected } = conversation;
        this.mentionInput.focus();
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, comment: `{[${firstName + " " + lastName} - ${username}](${id})} `, type: "reply" } });
    }

    handleChange(name, e) {
        const { dispatch, conversation } = this.props;
        const { Selected } = conversation;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, [name]: e.target.value } });
    }

    renderUsers(query, callback) {
        const { match, document } = { ...this.props };
        const workstreamIds = document.Selected.tagWorkstream.map(e => {
            return e.value;
        });
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            let fetchUrl = `/api/member?&workstreamId=${workstreamIds}&isDeleted=0`;
            if (typeof query != "undefined" && query != "") {
                fetchUrl += `&memberName=${query}`;
            }

            getData(fetchUrl, {}, c => {
                const { result } = { ...c.data };
                const projectMemberOptions = _(result)
                    .map(o => {
                        return { id: o.user.id, display: o.user.firstName + " " + o.user.lastName + " - " + o.user.username };
                    })
                    .value();
                callback(projectMemberOptions);
            });
        }, 1500);
    }

    handleSubmit() {
        const { dispatch, conversation, document, loggedUser, project, match } = this.props;
        const projectId = project.Selected.id;
        const commentText = conversation.Selected.comment;
        const commentSplit = commentText.split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit)
            .filter(o => {
                const regEx = /\[([^\]]+)]/;
                return regEx.test(o);
            })
            .map(o => {
                return _.toNumber(o.match(/\((.*)\)/).pop());
            })
            .value();

        const dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "document", linkId: document.Selected.id, usersId: loggedUser.data.id },
            document: document.Selected.origin,
            projectId: projectId,
            userId: loggedUser.data.id,
            username: loggedUser.data.username,
            reminderList: _.uniqBy(commentIds, `userId`),
            projectId: projectId
        };

        dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });

        postData(`/api/conversation/comment`, dataToBeSubmited, c => {
            dispatch({ type: "ADD_COMMENT_LIST", list: c.data });
            dispatch({ type: "SET_COMMENT_SELECTED", Selected: {} });
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
            showToast("success", "Comment successfully added.");
        });
    }

    fetchData(page) {
        const { dispatch, document, conversation } = { ...this.props };
        dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });
        getData(`/api/conversation/getConversationList?page=${page}&linkType=document&linkId=${document.Selected.id}`, {}, c => {
            dispatch({ type: "SET_COMMENT_LIST", list: conversation.List.concat(c.data.result), count: c.data.count });
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
            $(`#documentViewerModal`).modal("show");
        });
    }

    getNextResult() {
        const { conversation } = this.props;
        this.fetchData(conversation.Count.current_page + 1);
    }

    render() {
        const { dispatch, conversation } = { ...this.props };
        let commentText = typeof conversation.Selected.comment != "undefined" ? conversation.Selected.comment : "";
        const commentType = conversation.Selected.type || "";
        const { Count } = { ...conversation };
        const currentPage = typeof Count.current_page != "undefined" ? Count.current_page : 1;
        const lastPage = typeof Count.last_page != "undefined" ? Count.last_page : 1;

        return (
            <div>
                {conversation.List.length > 0 &&
                    _.map(conversation.List, (o, index) => {
                        const duration = moment.duration(moment().diff(moment(o.dateAdded)));
                        const date = duration.asDays() > 1 ? moment(o.dateAdded).format("MMMM DD, YYYY") : moment(o.dateAdded).from(new Date());
                        return (
                            <div key={index} class="comment bg-white">
                                <div class="thumbnail-profile">
                                    <img src={o.users.avatar} alt="Profile Picture" class="img-responsive" />
                                </div>
                                <div>
                                    <div>
                                        <MentionConvert string={o.comment} />
                                        <p class="note m0">
                                            Posted {date} by {o.users.firstName + " " + o.users.lastName}.
                                        </p>
                                        <p class="note m0">
                                            <a onClick={() => this.replyComment(o.users)}>Reply</a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {currentPage != lastPage && conversation.List.length > 0 && conversation.Loading != "RETRIEVING" && (
                    <p class="mb0 text-center">
                        <a onClick={() => this.getNextResult()}>Load More Comments</a>
                    </p>
                )}
                {conversation.Loading == "RETRIEVING" && conversation.List.length > 0 && <Loading />}
                {conversation.List.length === 0 && conversation.Loading != "RETRIEVING" && (
                    <p class="mb0 text-center">
                        <strong>No Records Found</strong>
                    </p>
                )}
                <div class="row mt10">
                    <div class="col-md-12 col-xs-12">
                        <div class="form-group mention">
                            {commentType != "" && (
                                <div>
                                    <p class="m0 note">
                                        Replying to a comment
                                        <a
                                            onClick={() => {
                                                dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...conversation.Selected, type: "" } });
                                            }}
                                        >
                                            <i class="fa fa-times ml5" aria-hidden="true" />
                                        </a>
                                    </p>
                                </div>
                            )}
                            <MentionsInput
                                value={commentText}
                                onChange={this.handleChange.bind(this, "comment")}
                                style={defaultStyle}
                                classNames={{
                                    mentions__input: "form-control"
                                }}
                                placeholder={"Type your comment"}
                                markup="{[__display__](__id__)}"
                                inputRef={input => {
                                    this.mentionInput = input;
                                }}
                            >
                                <Mention trigger="@" data={this.renderUsers} appendSpaceOnAdd={true} style={{ backgroundColor: "#ecf0f1", padding: 1 }} />
                            </MentionsInput>
                            {commentText != "" && (
                                <a class="btn btn-violet mt10" onClick={this.handleSubmit} disabled={conversation.Loading == "SUBMITTING"}>
                                    <span>{conversation.Loading == "SUBMITTING" ? "Sending ..." : "Submit Comment"}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DocumentComment);
