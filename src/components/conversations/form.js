import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from "../global/react-mention-style";
import { postData, showToast } from "../../globalFunction";
import CommentListItem from "./comment"

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        loggedUser: store.loggedUser,
        global: store.global
    }
})

export default class FormComponent extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            commentText: ""
        }
        this.fetchUsers = this.fetchUsers.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    fetchUsers(query, callback) {
        const { loggedUser , global } = { ...this.props };

        return global.SelectList.projectMemberList.map((o) => {
            let userName = o.firstName + " " + o.lastName ;
                if(userName.includes(query) && o.id != loggedUser.data.id){
                    return { display: o.firstName + " " + o.lastName, id: o.id }
                }
        }).filter((o) => { return o != undefined })
    }

    handleSubmit() {
        const { loggedUser, notes, dispatch } = this.props;
        const { commentText } = this.state;
        const data = notes.Selected;
        const commentSplit = (commentText).split(/{([^}]+)}/g).filter(Boolean);
        const commentIds = _(commentSplit).filter((o) => {
            const regEx = /\[([^\]]+)]/;
            return regEx.test(o)
        }).map((o) => {
            return { userId: _.toNumber(o.match(/\((.*)\)/).pop()) };
        }).value();
        this.setState({commentText: ""})
        let dataToBeSubmited = {
            filter: { seen: 0 },
            data: { comment: commentText, linkType: "notes", linkId: notes.Selected.id, usersId: loggedUser.data.id },
            reminder: {
                linkType: "notes",
                linkId: notes.Selected.id,
                type: "Tag in Comment",
                detail: "tagged in comment",
                projectId: notes.Selected.projectId,
                createdBy :loggedUser.data.id
            },
            reminderList: JSON.stringify(commentIds)
        };
        
        postData(`/api/conversation/comment`, dataToBeSubmited, c => {
            try {
              const currentData = notes.Selected;
              currentData.comments.push(c.data[0]);
              const listIndex = notes.List.indexOf(notes.Selected);
              const noteList = notes.List;
              noteList.splice(listIndex, 1, currentData);
              dispatch({ type: "SET_NOTES_SELECTED", Selected: currentData });
              dispatch({ type: "SET_NOTES_LIST", list: noteList });
              showToast("success", "Comment successfully added.");
            } catch(err) {
                // console.log(err);
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    renderStatus(data) {
        const { isActive, dueDate } = { ...data };
        const dueDateMoment = moment(dueDate);
        const currentDateMoment = moment(new Date());
        let taskStatus = 0;
        let statusColor = "#000";

        if (dueDateMoment.isBefore(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 2
        } else if (dueDateMoment.isSame(currentDateMoment, 'day') && data.status != 'Completed') {
            taskStatus = 1
        }

        if (isActive == 0) {
        } else if (taskStatus == 0) {
            statusColor = "#27ae60"
        } else if (taskStatus == 1) {
            statusColor = "#f39c12"
        } else if (taskStatus == 2) {
            statusColor = "#c0392b"
        }

        return statusColor;
    }

    renderPrivacy(privacy){
        let icon = "fa-users"; // public by default
        if ( privacy === "email" ) {
            icon = "fa-envelope";
        } else if ( privacy === "linked" ) {
            icon = "fa-link";
        } else if ( privacy === "private" ) {
            icon = "fa-lock";
        }
        return icon
    }

    render() {
        const { notes, setIsClosed, loggedUser } = { ...this.props }
        const data = notes.Selected;
        return (
            <div style={{ /*background:"#f5f5f5",*/ padding: "10px", }}>
                <div style={{marginBottom: "30px"}}>
                    <h4>{data.note}{(data.isClosed)?<span class="label" style={{margin: "5px", background: "red", color: "white" }}>CLOSED</span>:""}</h4>
                    { loggedUser.data.id === data.creator.id &&
                        <div class="dropdown" style={{float:"right"}}>
                            <button style={{padding:"3px",border:"none", paddingRight: "0px"}} class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                            <ul class="dropdown-menu  pull-right document-actions" aria-labelledby="dropdownMenu2" >
                            { (data.isClosed === 1) &&
                                <li><a href="javascript:void(0)" onClick={() => setIsClosed(0,data)}>Open</a></li>
                            }
                            { (data.isClosed === 0) &&
                                <li><a href="javascript:void(0)" onClick={() => setIsClosed(1,data)}>Close</a></li>
                            }
                            </ul>
                        </div>
                    }
                    <span style={{float:"right",padding:"5px",}} className={`fa ${this.renderPrivacy(data.privacyType)}`} ></span>
                    {
                        (data.tag.map((f)=>{
                            const color = this.renderStatus(f.tagTask);
                            return <span class="label" style={{margin: "5px", background: color }}>{f.tagTask.task}</span>
                        }))
                    }
                    <span class="fa fa-pencil"></span>
                </div>
                <div>Created by: {`${data.creator.firstName} ${data.creator.lastName} - ${moment(data.dateAdded).format("MM/DD/YYYY hh:mm")}` }</div>

                { data.comments.length == 0 && 
                    <div>
                        <hr />
                        <div>No Comment</div>
                    </div>
                }
                {
                    data.comments.map((e)=>{
                        return <CommentListItem commentData={e} fetchUsers={this.fetchUsers} />
                    })
                }
                { data.isClosed === 0 && 
                    <div class="form-group mention" style={{ marginLeft: 15 }}>
                        <hr />
                        <MentionsInput
                            value={this.state.commentText}
                            onChange={(e)=>{ this.setState({commentText: e.target.value}) }}
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
                            (typeof this.state.commentText != "undefined" && this.state.commentText != "") && <div>
                                <a href="javascript:void(0);" class="btn btn-primary mt5" title="Add"
                                    onClick={this.handleSubmit}
                                >
                                    Add
                                </a>
                            </div>
                        }
                    </div>
                }
                { data.isClosed === 1 && 
                    <div>
                        <hr />
                        <h4>{`${data.creator.firstName} ${data.creator.lastName} - ${moment(data.dateAdded).format("MM/DD/YYYY hh:mm")}` }</h4>
                        <h5>Closed this note.</h5>
                    </div>
                }
                
                
            </div>
        )
    }
}