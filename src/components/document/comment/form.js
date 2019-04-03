import React from "react";
import { connect } from "react-redux";
import { MentionsInput, Mention } from 'react-mentions';
import _ from "lodash";
import { postData, showToast } from '../../../globalFunction'
import defaultStyle from "../../global/react-mention-style";
import { withRouter } from "react-router";

@connect(({ document, conversation, users, loggedUser, global, members }) => {
    return {
        document,
        conversation,
        users,
        loggedUser,
        global,
        members,
    }
})

class Form extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "fetchUsers",
            "handleSubmit",
            "handleChange"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    handleChange(name, e) {
        let { dispatch, conversation } = this.props
        let Selected = Object.assign({}, conversation.Selected)
        Selected[name] = e.target.value;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: Selected })
    }

    fetchUsers(query, callback) {
        const { loggedUser, members } = { ...this.props };
        return members.List.map((o) => {
            let userName = o.user.firstName + " " + o.user.lastName;
            if (userName.includes(query) && o.user.id != loggedUser.data.id) {
                return { display: o.user.firstName + " " + o.user.lastName, id: o.user.id }
            }
        }).filter((o) => { return o != undefined })
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
            const emailAddress = members.List.filter((e) => { return e.user.id == _.toNumber(o.match(/\((.*)\)/).pop()) })[0].user.emailAddress
            return { userId: _.toNumber(o.match(/\((.*)\)/).pop()), emailAddress: emailAddress };
        }).value();

        const dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "document", linkId: document.Selected.id, usersId: loggedUser.data.id },
            document: document.Selected.origin,
            projectId: projectId,
            usersId: loggedUser.data.id,
            username: loggedUser.data.username,
            reminderList: JSON.stringify(_.uniqBy(commentIds, `userId`)),
        };
        postData(`/api/conversation/comment`, dataToBeSubmited, (c) => {
            dispatch({ type: 'ADD_COMMENT_LIST', list: c.data })
            dispatch({ type: 'SET_COMMENT_SELECTED', Selected: {} })
            showToast('success', 'Comment successfully added.')
        })
    }

    render() {
        const { conversation } = { ...this.props };
        let commentText = (typeof conversation.Selected.comment != "undefined") ? conversation.Selected.comment : "";

        return (
            <div class="row mt10">
                <div class="col-md-12 col-xs-12">
                    <div class="form-group mention">
                        <MentionsInput
                            value={commentText}
                            onChange={this.handleChange.bind(this, "comment")}
                            style={defaultStyle}
                            classNames={{
                                mentions__input: 'form-control'
                            }}
                            markup="{[__display__](__id__)}"
                            placeholder={"Comment Here"}
                        >
                            <Mention
                                trigger="@"
                                data={this.fetchUsers}
                                appendSpaceOnAdd={true}
                                style={{ backgroundColor: '#ecf0f1', padding: 1 }}
                            />
                        </MentionsInput>
                        {
                            (typeof conversation.Selected.comment != "undefined" && conversation.Selected.comment != "") &&
                             <div>
                                <a href="javascript:void(0);" class="btn btn-violet mt10" title="Add"
                                    onClick={this.handleSubmit}
                                >
                                    <span>Submit Comment</span>
                                </a>
                            </div>
                        }
                    </div>
                </div>
            </div >
        )
    }
}

export default withRouter(Form)