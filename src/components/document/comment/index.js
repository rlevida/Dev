import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { MentionConvert } from "../../../globalComponents";
import { MentionsInput, Mention } from 'react-mentions';
import moment from 'moment';
import { postData, showToast, getData } from '../../../globalFunction'
import defaultStyle from "../../global/react-mention-style";
import { withRouter } from "react-router";

let keyTimer = "";

@connect(({ task, conversation, document, loggedUser }) => {
    return {
        task,
        conversation,
        document,
        loggedUser
    }
})

class DocumentComment extends React.Component {
    constructor(props) {
        super(props)
        _.map([
            "renderUsers",
            "handleSubmit",
            "handleChange",
            "replyComment"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    replyComment({ firstName, lastName, username, id }) {
        const { dispatch, conversation } = this.props
        const { Selected } = conversation;
        this.mentionInput.focus();
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, comment: `{[${firstName + " " + lastName} - ${username}](${id})} `, type: "reply" } });
    }

    handleChange(name, e) {
        const { dispatch, conversation } = this.props
        const { Selected } = conversation;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...Selected, [name]: e.target.value } });
    }

    renderUsers(query, callback) {
        const { match, document } = { ...this.props };
        const { projectId } = { ...match.params };
        const workstreamIds = document.Selected.tagWorkstream.map((e) => { return e.value })
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {

            let fetchUrl = `/api/member?&workstreamId=${workstreamIds}&isDeleted=0`
            if (typeof query != "undefined" && query != "") {
                fetchUrl += `&memberName=${query}`;
            }

            getData(fetchUrl, {}, (c) => {
                const { result } = { ...c.data }
                const projectMemberOptions = _(result)
                    .map((o) => { return { id: o.user.id, display: o.user.firstName + " " + o.user.lastName + ' - ' + o.user.username } })
                    .value();
                callback(projectMemberOptions);
            });

        }, 1500);
    }

    handleSubmit() {
        const { dispatch, conversation, document, loggedUser, members, match } = this.props;
        const projectId = match.params.projectId;
        const commentText = conversation.Selected.comment;
        const commentSplit = (commentText).split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit).filter((o) => {
            const regEx = /\[([^\]]+)]/;
            return regEx.test(o)
        }).map((o) => {
            return _.toNumber(o.match(/\((.*)\)/).pop());
        }).value();

        const dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "document", linkId: document.Selected.id, usersId: loggedUser.data.id },
            document: document.Selected.origin,
            projectId: projectId,
            userId: loggedUser.data.id,
            username: loggedUser.data.username,
            reminderList: JSON.stringify(_.uniqBy(commentIds, `userId`)),
        };

        dispatch({ type: "SET_COMMENT_LOADING", Loading: "SUBMITTING" });

        postData(`/api/conversation/comment`, dataToBeSubmited, (c) => {
            dispatch({ type: 'ADD_COMMENT_LIST', list: c.data })
            dispatch({ type: 'SET_COMMENT_SELECTED', Selected: {} })
            dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
            showToast('success', 'Comment successfully added.')
        })
    }


    render() {
        const { dispatch, conversation } = { ...this.props };
        let commentText = (typeof conversation.Selected.comment != "undefined") ? conversation.Selected.comment : "";
        const commentType = conversation.Selected.type || "";

        return (
            <div>
                {
                    (conversation.List.length > 0) &&
                    _.map(conversation.List, (o, index) => {
                        const duration = moment.duration(moment().diff(moment(o.dateAdded)));
                        const date = (duration.asDays() > 1) ? moment(o.dateAdded).format("MMMM DD, YYYY") : moment(o.dateAdded).from(new Date());
                        return (
                            <div key={index} class="comment bg-white">
                                <div class="thumbnail-profile">
                                    <img src={o.users.avatar} alt="Profile Picture" class="img-responsive" />
                                </div>
                                <div>
                                    <div>
                                        <MentionConvert string={o.comment} />
                                        <p class="note m0">Posted {date} by {o.users.firstName + " " + o.users.lastName}.</p>
                                        <p class="note m0"><a onClick={() => this.replyComment(o.users)}>Reply</a></p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
                <div class="row mt10">
                    <div class="col-md-12 col-xs-12">
                        <div class="form-group mention">
                            {
                                (commentType != "") && <div>
                                    <p class="m0 note">Replying to a comment
                                    <a onClick={() => {
                                            dispatch({ type: "SET_COMMENT_SELECTED", Selected: { ...conversation.Selected, type: "" } });
                                        }}>
                                            <i class="fa fa-times ml5" aria-hidden="true"></i>
                                        </a>
                                    </p>
                                </div>
                            }
                            <MentionsInput
                                value={commentText}
                                onChange={this.handleChange.bind(this, "comment")}
                                style={defaultStyle}
                                classNames={{
                                    mentions__input: 'form-control'
                                }}
                                placeholder={"Type your comment"}
                                markup="{[__display__](__id__)}"
                                inputRef={(input) => { this.mentionInput = input; }}
                            >
                                <Mention
                                    trigger="@"
                                    data={this.renderUsers}
                                    appendSpaceOnAdd={true}
                                    style={{ backgroundColor: '#ecf0f1', padding: 1 }}
                                />
                            </MentionsInput>
                            {
                                (commentText != "") && <a
                                    class="btn btn-violet mt10"
                                    onClick={this.handleSubmit}
                                    disabled={(conversation.Loading == "SUBMITTING")}
                                ><span>{
                                    (conversation.Loading == "SUBMITTING") ? "Sending ..." : "Submit Comment"
                                }</span></a>
                            }
                        </div>
                    </div>
                </div >
            </div>
        )
    }
}

export default withRouter(DocumentComment);