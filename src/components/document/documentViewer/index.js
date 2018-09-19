import React from "react"
import ReactDOM from "react-dom"
import Select from 'react-select'
import moment from 'moment'

import { showToast,displayDate,setDatePicker , getFilePathExtension} from '../../../globalFunction'
import { HeaderButtonContainer,HeaderButton,DropDown } from "../../../globalComponents"
import Mention, { toString, toEditorState , getMentions } from 'rc-editor-mention';
import Parser from 'html-react-parser'
const Nav = Mention.Nav;

import { connect } from "react-redux"

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        users: store.users,
        settings: store.settings,
        conversation: store.conversation,
        global: store.global
    }
})

export default class DocumentViewerComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            comment: "",
            contributors: [],
            suggestions: [],
            // users: [],
            mentions: [],
            editorState : toEditorState(''),
            reminderList : []
        }
    }

    componentWillMount() {
        let { socket  , document , users } = this.props
            socket.emit("GET_COMMENT_LIST",{ filter : { linkType : "project" , linkId : document.Selected.id }})
            // this.setState({ users : users.List  })
    }

    // onChange(e){
    //     let { comment } = this.state;
    //         this.setState({ [e.target.name] : e.target.value });
    // }

    submitComment(){
        let { socket , loggedUser , document , global} = this.props;
        let { comment , mentions } = this.state;
        let reminderList = []
            global.SelectList.ProjectMemberList.map( user =>{ 
                let tempData = `${user.firstName}-${user.lastName}`
                mentions.map( m =>{
                    if(tempData == m.split("@").join("")){
                            reminderList.push({userId :user.id})
                    }
                })
            })
        socket.emit("SAVE_OR_UPDATE_CONVERSATION", { 
            filter: { seen: 0 },
            data: { comment : comment , linkType : "project" , linkId : document.Selected.id , usersId : loggedUser.data.id } ,
            reminder : { 
                reminderType : "document" , 
                reminderTypeId : document.Selected.id , 
                reminderDetail : "tagged in comment" ,
                projectId : project
            },
            reminderList : JSON.stringify(reminderList)
        });
    //         this.setState({ comment : "" , editorState :toEditorState('') })
    // }
    }

    onSearchChange = (value) => {
        const searchValue = value.toLowerCase();
        const { mentions } = this.state;
        const { global } = this.props;
        const filtered = global.SelectList.ProjectMemberList.filter( e => { 
            return (
                 `${e.firstName}-${e.lastName}`.toLowerCase().indexOf(searchValue) !== -1
                && mentions.indexOf(`@${e.firstName}-${e.lastName}`) === -1
            )
        });

        const suggestions = filtered.map(e =>
            <Nav style={{ height: 34 }} value={ `${e.firstName}-${e.lastName}`} key={e.id} >
              <span className="meta">{ `${e.firstName} ${e.lastName}` }</span>
            </Nav>);

        this.setState({
          suggestions,
        });
    }

    onChange = (e) => {
        let { global } = this.props;
        let { reminderList } = this.state
        let mentions = getMentions(e);
        let newData = toString(e, { encode: true })

        mentions.map( t =>{
           newData =  newData.replace(t , `<a href="javascript:void(0);" >${(t.split("@").join("")).split("-").join(" ")}</a>`)
        })

        this.setState({
            mentions : mentions,
            comment : newData,
            editorState : e,
            reminderList, reminderList
        });
    }

    render() {
        let { dispatch , document, users , settings , conversation , global } = this.props , 
            { comment , suggestions , editorState} = this.state ,
            isDocument = true , ext = "";
        let uploadedBy =  global.SelectList.ProjectMemberList.filter( e =>{ return e.id == document.Selected.uploadedBy});
            ext = getFilePathExtension(document.Selected.name);
            if(ext != "pdf"){
                isDocument = false;
            }
        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_DOCUMENT_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li>
                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                    
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">DOCUMENT VIEWER</h3>
                            </div>
                            <div class="panel-body">
                                <div class="row" style={{height:"500px"}}>
                                    <div class="col-lg-6 col-md-6 col-xs-12" style={{height:"100%"}}>
                                        <div id="documentImage" style={{textAlign:"center" , height:"100%" }}>
                                        { (isDocument) ? 
                                                <embed src={`${settings.imageUrl }/upload/${document.Selected.name}`} type="application/pdf" width="100%" height="100%">
                                                </embed>
                                                :  <span style={{fontSize:"100px"}} class="glyphicon glyphicon-file"></span>
                                        }
                                        </div>
                                    </div>
                                    <div class="col-lg-6 col-md-6 col-xs-12">
                                        { !isDocument && <a class="btn btn-primary btn-flat pull-right" style={{ cursor: "pointer" }} title="Link" target="_blank" 
                                            href={ settings.imageUrl + "/upload/" + document.Selected.name }>
                                            Download
                                        </a>
                                        }
                                        <br/><br/>
                                        <span class="glyphicon glyphicon-file"></span>
                                        {document.Selected.origin}
                                        <br/>
                                        Uploaded by { uploadedBy.length > 0 ? uploadedBy[0].emailAddress  : ""}  
                                        <br/> 
                                        {moment(document.Selected.dateAdded).format('L')} 
                                        <br/>
                                        <h4>Comments</h4>
                                        <hr/>
                                        { (conversation.List.length > 0) && 
                                            conversation.List.map( (e,i) =>{
                                                return (
                                                    <span key={i}>
                                                        <p>{ Parser(e.comment) } </p>
                                                        <p><i> By { global.SelectList.ProjectMemberList.filter( f => { return f.id == e.usersId})[0].emailAddress } , { moment(e.dateAdded).format('L') }</i></p>
                                                        <br/>
                                                    </span>
                                                )
                                            })
                                        }
                                        <div class="form-group"> 
                                        <Mention
                                            style={{ height: 200 }}
                                            ref="mention"
                                            onSearchChange={this.onSearchChange}
                                            onChange={this.onChange}
                                            defaultValue={toEditorState("")}
                                            suggestions={ suggestions }
                                            value = {editorState} 
                                            prefix="@"
                                            multiLines
                                            noRedup
                                        />
                                            {/* <textarea class="form-control" name="comment" rows="4" placeholder="New comment" value={comment} onChange={(e)=>this.onChange(e)}></textarea> */}
                                        </div> 
                                        { (comment != "") && 
                                            <button class="btn btn-primary btn-flat pull-right" onClick={()=> this.submitComment()}>Submit</button>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}