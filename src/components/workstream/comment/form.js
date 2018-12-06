import React from "react";
import { connect } from "react-redux";
import { MentionsInput, Mention } from 'react-mentions';
import _ from "lodash";
import defaultStyle from "../../global/react-mention-style";

@connect(({ task, conversation, socket, users, loggedUser, global, workstream }) => {
    return {
        task,
        conversation,
        socket: socket.container,
        users,
        loggedUser,
        global,
        workstream
    }
})

export default class Form extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.fetchUsers = this.fetchUsers.bind(this);
    }

    handleChange(name, e) {
        let { dispatch, conversation } = this.props
        let Selected = Object.assign({}, conversation.Selected)
        Selected[name] = e.target.value;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: Selected })
    }

    fetchUsers(query, callback) {
        const { loggedUser, global, workstream } = { ...this.props };

        return workstream.Selected.taskMemberList.map((o) => {
            let userName = o.firstName + " " + o.lastName;
            if (userName.includes(query) && o.id != loggedUser.data.id) {
                return { display: o.firstName + " " + o.lastName, id: o.id }
            }
        }).filter((o) => { return o != undefined })
    }

    handleSubmit() {
        const { socket, conversation, task, loggedUser } = this.props;
        const commentText = conversation.Selected.comment;
        const commentSplit = (commentText).split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit).filter((o) => {
            const regEx = /\[([^\]]+)]/;
            return regEx.test(o)
        }).map((o) => {
            return { userId: _.toNumber(o.match(/\((.*)\)/).pop()) };
        }).value();

        const dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "task", linkId: task.Selected.id, usersId: loggedUser.data.id },
            reminder: {
                linkType: "task",
                linkId: task.Selected.id,
                type: "Tag in Comment",
                detail: "tagged in comment",
                projectId: task.Selected.projectId,
                createdBy: loggedUser.data.id
            },
            reminderList: JSON.stringify(commentIds)
        };
        socket.emit("SAVE_OR_UPDATE_CONVERSATION", dataToBeSubmited);
    }

    render() {
        const { conversation } = { ...this.props };
        let commentText = (typeof conversation.Selected.comment != "undefined") ? conversation.Selected.comment : "";

        return (
            <div class="row mt10">
                <div class="col-md-12 col-xs-12">
                    <div class="form-group mention" style={{ marginLeft: 15 }}>
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

                    </div>
                    {
                        (typeof conversation.Selected.comment != "undefined" && conversation.Selected.comment != "") && <div>
                            <a href="javascript:void(0);" class="btn btn-primary mt5" title="Add"
                                onClick={this.handleSubmit}
                            >
                                Add
                            </a>
                        </div>
                    }
                </div>
            </div >
        )
    }
}