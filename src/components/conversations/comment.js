import React from "react"
import { connect } from "react-redux"
import { MentionConvert } from "../../globalComponents";
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from "../global/react-mention-style";
import { deleteData, putData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class CommentListItem extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            state: "View",
            commentText: "",
        }

        this.deleteData = this.deleteData.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    deleteData() {
        const { commentData, notes, dispatch } = this.props;
        if (confirm("Do you really want to delete this comment?")) {
            deleteData(`/api/conversation/comment/${commentData.id}`, {}, (e) => {
                const currentData = notes.Selected;
                const commentIndex = currentData.comments.indexOf(commentData)
                currentData.comments.splice(commentIndex, 1);
                const listIndex = notes.List.indexOf(notes.Selected);
                const noteList = notes.List;
                noteList.splice(listIndex, 1, currentData);
                dispatch({ type: "SET_NOTES_SELECTED", Selected: currentData });
                dispatch({ type: "SET_NOTES_LIST", list: noteList });
                showToast("success", "Comment successfully deleted.");
            })
        }
    }

    handleSubmit() {
        const { loggedUser, notes, dispatch, commentData, global } = this.props;
        const { commentText } = this.state;
        const data = notes.Selected;
        const commentSplit = (commentText).split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit).filter((o) => {
            const regEx = /\[([^\]]+)]/;
            return regEx.test(o)
        }).map((o) => {
            const emailAddress = global.SelectList.projectMemberList.filter((e) => { return e.id == _.toNumber(o.match(/\((.*)\)/).pop()) })[0].emailAddress
            return { userId: _.toNumber(o.match(/\((.*)\)/).pop()), emailAddress: emailAddress };
        }).value();
        this.setState({ commentText: "", state: "View" })

        const dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "notes", linkId: notes.Selected.id, usersId: loggedUser.data.id },
            note: notes.Selected.note,
            projectId: project,
            userId: loggedUser.data.id,
            username: loggedUser.data.username,
            reminderList: JSON.stringify(_.uniqBy(commentIds, `userId`)),
        };

        putData(`/api/conversation/comment/${commentData.id}`, dataToBeSubmited, c => {
            try {
                const currentData = notes.Selected;
                const commentIndex = currentData.comments.indexOf(commentData)
                currentData.comments.splice(commentIndex, 1, c.data[0]);
                const listIndex = notes.List.indexOf(notes.Selected);
                const noteList = notes.List;
                noteList.splice(listIndex, 1, currentData);
                dispatch({ type: "SET_NOTES_SELECTED", Selected: currentData });
                dispatch({ type: "SET_NOTES_LIST", list: noteList });
                showToast("success", "Comment successfully updated.");
            } catch (err) {
                // console.log(err);
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    render() {
        const { commentData, fetchUsers, loggedUser } = this.props;
        const { state } = this.state;
        return (
            <div>
                <hr />
                <div>
                    {(commentData.seenComments.length == 0) &&
                        <span class="mb10" style={{ position: 'relative', display: 'block' }}><label class="label label-primary ">new</label></span>
                    }
                    <span>{`${commentData.users.firstName} ${commentData.users.lastName}`}</span>{'     '}<span>{moment(commentData.dateAdded).format("MM/DD/YYYY hh:mm")}</span>
                </div>
                {state === "View" &&
                    <div>
                        {loggedUser.data.id === commentData.users.id &&
                            <div class="dropdown" style={{ float: "right" }}>
                                <button style={{ padding: "3px", border: "none", paddingRight: "0px" }} class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                <ul class="dropdown-menu  pull-right document-actions" aria-labelledby="dropdownMenu2" >
                                    <li><a href="javascript:void(0)" onClick={() => this.setState({ state: "Edit", commentText: commentData.comment })}>Edit</a></li>
                                    <li><a href="javascript:void(0)" onClick={() => this.deleteData()}>Delete</a></li>
                                </ul>
                            </div>
                        }
                        <br />
                        <br />
                        <MentionConvert string={commentData.comment} />
                    </div>
                }
                {state === "Edit" &&
                    <div>
                        <MentionsInput
                            value={this.state.commentText}
                            onChange={(e) => { this.setState({ commentText: e.target.value }) }}
                            style={defaultStyle}
                            classNames={{
                                mentions__input: 'form-control'
                            }}
                            markup="{[__display__](__id__)}"
                            placeholder={"Comment Here"}
                        >
                            <Mention
                                trigger="@"
                                data={fetchUsers}
                                appendSpaceOnAdd={true}
                                style={{ backgroundColor: '#ecf0f1', padding: 1 }}
                            />
                        </MentionsInput>
                        <div>
                            <a href="javascript:void(0);" class="btn btn-primary mt5" title="Save" onClick={this.handleSubmit} >
                                Save
                                </a>
                            <a style={{ paddingLeft: "10px" }} href="javascript:void(0);" class="btn btn-primary mt5" title="Cancel"
                                onClick={() => this.setState({ state: "View", commentText: commentData.comment })} >
                                Cancel
                                </a>
                        </div>
                    </div>
                }
            </div>
        )
    }
}