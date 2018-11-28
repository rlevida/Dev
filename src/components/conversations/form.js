import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";
import { MentionsInput, Mention } from 'react-mentions';
import defaultStyle from "../global/react-mention-style";
import { putData, postData, showToast } from "../../globalFunction";
import CommentListItem from "./comment"
import { DropDown } from "../../globalComponents";
import UploadModal from "./uploadModal";

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
            commentText: "",
            selectedId: 0,
            notesState: {
                accessType: "INTERNAL_ONLY", // INTERNAL_ONLY, ALL_CLIENT, SPECIFIC_CLIENT,
                specificClient: "[]",
                note: "",
            },
            updatePropsTemp: ""
        }
        this.fetchUsers = this.fetchUsers.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this)
        this.noteHasChange = this.noteHasChange.bind(this)
        this.updateNotesData = this.updateNotesData.bind(this)
    }

    updateNotesData(){
        const { notes, dispatch } = { ...this.props }
        const { notesState } = { ...this.state }
        let updateData = notesState;
        updateData.specificClient = JSON.stringify(updateData.specificClient)
        putData(`/api/conversation/${notes.Selected.id}`, updateData, (c) => {
            if (c.status == 200) {
                let data = c.data[0];
                let list = notes.List;
                const selectedIndex = list.indexOf(notes.Selected);
                list.splice(selectedIndex, 1, data);
                this.props.updateSelectedNotes(data);
                dispatch({ type: "SET_NOTES_LIST", list: list });
                $("#NewNoteModal").modal("hide")
                
                showToast("success", "Notes successfully added.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        })
    }

    noteHasChange(){
        const { notes } = { ...this.props }
        const { notesState } = { ...this.state }
        let hasChange = false;
        let specificClient = notes.Selected.specificClient || "[]"
        let specificClientState = notesState.specificClient || "[]"
        if(typeof specificClient !== "string"){
            specificClient = JSON.stringify(specificClient)
        }
        if(typeof specificClientState !== "string"){
            specificClientState = JSON.stringify(specificClientState)
        }
        if( notes.Selected.accessType !== notesState.accessType || 
            specificClient !== specificClientState ||
            notes.Selected.note !== notesState.note
        ){
            hasChange = true;
        }

        return hasChange;
    }

    componentDidMount(){
        const { notes } = { ...this.props }
        this.setState({
            selectedId: notes.Selected.id,
            notesState: {
                accessType: notes.Selected.accessType,
                specificClient: notes.Selected.specificClient || "[]",
                note: notes.Selected.note
            }
        })
    }

    shouldComponentUpdate(props, state){
        const { notes } = { ...props }
        const { notesState, selectedId } = { ...state }
        let hasChange = false;
        const specificClient = notes.Selected.specificClient || "[]"
        if( notes.Selected.accessType !== notesState.accessType || 
            specificClient !== notesState.specificClient ||
            notes.Selected.note !== notesState.note ||
            notes.Selected.id !== selectedId ||
            state.commentText !== this.state.commentText ||
            notesState.accessType !== this.state.notesState.accessType ||
            notesState.specificClient !== this.state.notesState.specificClient ||
            this.state.updatePropsTemp !== JSON.stringify(notes) ||
            notesState.note !== this.state.notesState.note
        ){
            hasChange = true;
        }
        return hasChange;
    }

    componentWillReceiveProps(props){
        const { notes } = { ...props }
        this.setState({
            selectedId: notes.Selected.id,
            notesState: {
                accessType: notes.Selected.accessType,
                specificClient: notes.Selected.specificClient || [],
                note: notes.Selected.note
            },
            updatePropsTemp: JSON.stringify(notes)
        })
    }

    setDropDownMultiple(name, values) {
        const { notesState } = { ...this.state };
        const data = this.state.notesState;
        data[name] = values;
        this.setState({ notesState: data })
    }

    fetchUsers(query, callback) {
        const { loggedUser, global, notes } = { ...this.props };

        let memberList = global.SelectList.projectMemberList;

        if( notes.Selected.accessType === "INTERNAL_ONLY" ){
            memberList = memberList.filter(e => e.userType === 'Internal')
        }
        if( notes.Selected.accessType === "SPECIFIC_CLIENT" ){
            memberList = [];
            global.SelectList.projectMemberList.map((e) => {
                if(e.userType === 'Internal'){
                    memberList.push(e);
                } else {
                    const specificClient = (typeof notes.Selected.specificClient === 'string')
                            ? JSON.parse(notes.Selected.specificClient)
                            : notes.Selected.specificClient;
                    specificClient.map((f)=>{
                        if( f.value === e.id ) {
                            memberList.push(e);
                        }
                    })
                }
            })
        }

        return memberList.map((o) => {
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
              this.props.updateSelectedNotes(currentData);
              dispatch({ type: "SET_NOTES_LIST", list: noteList });
              showToast("success", "Comment successfully added.");
            } catch(err) {
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
        const { notes, setIsClosed, loggedUser, global } = { ...this.props }
        const { notesState, commentText } = { ...this.state }
        const { specificClient } = { ...notesState }
        const data = notes.Selected;

        const clientUser = [];
        global.SelectList.projectMemberList.map((e)=>{
            if(e.userType === 'External' ){
                clientUser.push({ id: e.id, name: `${e.firstName} ${e.lastName}`  })
            }
        })
        return (
            <div style={{ /*background:"#f5f5f5",*/ padding: "10px", }}>
                <div style={{marginBottom: "30px"}}>
                    <h4>
                        {data.note}
                        {(data.isClosed)?<span class="label" style={{margin: "5px", background: "red", color: "white" }}>CLOSED</span>:""}
                    </h4>
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
                    { this.noteHasChange() &&
                        <a style={{float: 'right'}} 
                            class="btn btn-primary" 
                            href="javascript:void(0)" 
                            onClick={(e)=>{
                                this.updateNotesData();
                            }}
                        >Save</a>
                    }
                    {
                        (data.tag.map((f)=>{
                            const color = this.renderStatus(f.tagTask);
                            return <span class="label" style={{margin: "5px", background: color }}>{f.tagTask.task}</span>
                        }))
                    }
                    <span class="fa fa-pencil"></span>
                </div>
                <div class="row">
                    <div class="form-group">
                        <label class="col-md-12 col-xs-12 control-label">
                            <input type="checkbox"
                                style={{ width: "15px", marginTop: "10px" }}
                                checked={(notesState.accessType === 'INTERNAL_ONLY')?true:false}
                                onChange={() => { 
                                    notesState.specificClient = []; 
                                    notesState.accessType = 'INTERNAL_ONLY'; 
                                    this.setState({ notesState }) 
                                }}
                            />&nbsp;&nbsp;&nbsp;&nbsp;
                            Internal Only
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="col-md-12 col-xs-12 control-label">
                            <input type="checkbox"
                                style={{ width: "15px", marginTop: "10px" }}
                                checked={(notesState.accessType === 'ALL_CLIENT')?true:false}
                                onChange={() => { 
                                    notesState.specificClient = []; 
                                    notesState.accessType = 'ALL_CLIENT'; 
                                    this.setState({ notesState }) 
                                }}
                            />&nbsp;&nbsp;&nbsp;&nbsp;
                            Include all client in this project
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="col-md-12 col-xs-12 control-label">
                            <input type="checkbox"
                                style={{ width: "15px", marginTop: "10px" }}
                                checked={(notesState.accessType === 'SPECIFIC_CLIENT')?true:false}
                                onChange={() => { notesState.accessType = 'SPECIFIC_CLIENT'; this.setState({ notesState }) }}
                            />&nbsp;&nbsp;&nbsp;&nbsp;
                            Include specific client in this project
                        </label>
                    </div>
                    { (notesState.accessType === 'SPECIFIC_CLIENT') &&
                        <div class="form-group">
                            <label class="col-md-12 col-xs-12 control-label">Please specify. . .</label>
                            <div class="col-md-6 col-xs-12">
                                <DropDown multiple={true}
                                    required={false}
                                    options={clientUser}
                                    selected={(typeof specificClient === "string")?JSON.parse(specificClient):specificClient}
                                    onChange={(e) => { this.setDropDownMultiple('specificClient', e) }} />
                                <div class="help-block with-errors"></div>
                            </div>
                        </div>
                    }
                </div>
                <div>Created by: {`${data.creator.firstName} ${data.creator.lastName} - ${moment(data.dateAdded).format("MM/DD/YYYY hh:mm")}` }</div>
                <div>
                    <h3>Attachments <a href="javascript:void(0)" data-toggle="modal" data-target="#uploadFileModal" ><span class="fa fa-paperclip"></span></a></h3>
                    <ul>
                        { 
                            data.documentTags.map((e)=>{
                                return <li>{e.document.origin}</li>
                            })
                        }
                        <li></li>
                    </ul>
                </div>
                <hr />
                <h3>Comments</h3>
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
                            value={commentText}
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
                            (typeof commentText !== "undefined" && commentText !== "") && <div>
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
                
                <UploadModal updateSelectedNotes={this.props.updateSelectedNotes} />
            </div>
        )
    }
}