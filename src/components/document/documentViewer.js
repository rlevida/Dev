import React from "react"
import ReactDOM from "react-dom"
import Select from 'react-select'
import moment from 'moment'

import { showToast,displayDate,setDatePicker , getFilePathExtension} from '../../globalFunction'
import { HeaderButtonContainer,HeaderButton,DropDown } from "../../globalComponents"
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
        conversation: store.conversation
    }
})


export default class DocumentViewerComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            comment: "",
            contributors: [],
            suggestions: [],
            users: [],
            mentions: [],
            editorState : toEditorState('')
        }
    }

    componentWillMount() {
        let { socket  , document , users } = this.props
            socket.emit("GET_COMMENT_LIST",{ filter : { documentId : document.Selected.id , linkType : "project" , linkId : project , }})
            this.setState({ users : users.List  })
    }

    // onChange(e){
    //     let { comment } = this.state;
    //         this.setState({ [e.target.name] : e.target.value });
    // }

    submitComment(){
        let { socket , loggedUser , document} = this.props;
        let { comment } = this.state;

        socket.emit("SAVE_OR_UPDATE_CONVERSATION", { 
                data: { comment : comment , linkType : "project" , linkId : project , usersId : loggedUser.data.id , documentId : document.Selected.id } 
            });
            this.setState({ comment : "" , editorState :toEditorState('') })
    }

    onSearchChange = (value) => {
        const searchValue = value.toLowerCase();
        const { mentions , users } = this.state;
        const filtered = users.filter( e => { 
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

        const mentions = getMentions(e);
        let newData = toString(e, { encode: true })
        mentions.map( t =>{
           newData =  newData.replace(t , `<a href="javascript:void(0);" >${(t.split("@").join("")).split("-").join(" ")}</a>`)
        })

        this.setState({
            mentions : mentions,
            comment : newData,
            editorState : e
        });
    }

    render() {
        let { dispatch , document, users , settings , conversation } = this.props , 
            { comment , suggestions , editorState} = this.state ,
            isDocument = true , ext = "";
        let uploadedBy =  users.List.filter( e =>{ return e.id == document.Selected.uploadedBy});
            ext = getFilePathExtension(document.Selected.name);
            if( ext == "jpeg" || ext == "png"){
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
                                    <div class="col-lg-6 col-md-6 col-xs-12">
                                        <div id="documentImage" style={{textAlign:"center" , height:"100%" }}>
                                        { (isDocument) ? 
                                            <span style={{fontSize:"100px"}} class="glyphicon glyphicon-file"></span>
                                                : <img src={ `${settings.imageUrl }/upload/${document.Selected.name}`} width="100" height="100" /> 
                                        }
                                        </div>
                                    </div>
                                    <div class="col-lg-6 col-md-6 col-xs-12">
                                        <a class="btn btn-primary btn-flat pull-right" style={{ cursor: "pointer" }} title="Link" target="_blank" 
                                            href={ settings.imageUrl + "/upload/" + document.Selected.name }>
                                            Download
                                        </a>
                                        <br/><br/>
                                        <span class="glyphicon glyphicon-file"></span>
                                        {document.Selected.origin}
                                        <br/>
                                        Uploaded by { uploadedBy[0].emailAddress }  
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
                                                        <p><i> By { users.List.filter( f => { return f.id == e.usersId})[0].emailAddress } , { moment(e.dateAdded).format('L') }</i></p>
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