import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../../globalComponents";
import moment from 'moment'
import FileUpload from 'react-fileupload';
import Dropzone from 'react-dropzone';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users : store.users,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        projectData : store.project,
        folder : store.folder

    }
})
export default class DocumentNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : [] , 
            upload : false,
            loading : false,
            tags : [],
            files : []
        }
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_STATUS",record:{id:id,status:(active==1)?0:1}});
            socket.emit("SAVE_OR_UPDATE_DOCUMENT",{data : {id:id,active:(active==1)?0:1}});
    }

    deleteDocument(id){
        let { socket } = this.props;
            if(confirm("Do you really want to delete this record?")){
                socket.emit("DELETE_DOCUMENT",{id:id});
            }
    }

    saveDocument(){
        let { socket , loggedUser } = this.props;
        let { tempData , tags } = this.state;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { 
                data: tempData , userId : loggedUser.data.id, project: project, tags: JSON.stringify(tags) 
            });
            this.setState({  upload : false ,   tempData : [] , tags : [] });
    }

    viewDocument(data){
        let { socket, dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected : data });
    }

    handleIsCompleted( data , value ){
        let { socket , document } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data : { id: data.id , isCompleted : !value  }});
    }

    starDocument(data , isStarred){
        let { socket , loggedUser } = this.props;
            if(isStarred){
                socket.emit("DELETE_STARRED", { id : data.id } );
            }else{
                socket.emit("SAVE_STARRED", { data : { usersId : loggedUser.data.id , linkType : "project" , linkId : data.id } });
            }
    }

    editDocument(data , type , list ){
        let { dispatch } = this.props;
        let newData = { ...data } , tempTags = [];
            
            if(typeof list != "undefined"){
                list.map( e =>{
                    if( e.tagTypeId == data.id && e.linkType == "workstream"){
                        tempTags.push( { value : `workstream-${e.linkId}` , label: e.name })
                    }
                    if( e.tagTypeId == data.id && e.linkType == "task"){
                        tempTags.push( { value : `task-${e.linkId}` , label: e.name })
                    }
                }) 
            }     

            newData = { ...data , tags: JSON.stringify(tempTags) } 

            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected: newData });
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type })
    }

    

    moveToLibrary(data){
        let { socket } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT" , { data : { status : "library" , id : data.id , isCompleted : 1 } , type : "project"})
    }

    moveToFolder(folderData , documentData){
        let { socket } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data :{ ...documentData , status : "library", folderId : folderData.id , isCompleted : 1 } , type : "project"})
    }

    render() {
        let { document, users , settings , starred , loggedUser , workstream , global , task , folder } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [];

            if( document.List.length > 0 ){
                document.List.filter( e =>{
                    if( e.status == "new" && e.isCompleted != 1 ){
                        documentList.newUpload.push(e)
                    }
                    if( e.status == "library" && e.isCompleted != 1 ){
                        documentList.library.push(e)
                    }
                })
            }

            if(typeof global.SelectList.tagList != "undefined"){ // FOR TAG OPTIONS
                global.SelectList.tagList.map( t => {
                    if(workstream.List.filter( w => { return w.id == t.linkId && t.linkType == "workstream"} ).length > 0 ){
                        let workstreamName =  workstream.List.filter( w => { return w.id == t.linkId})[0].workstream;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : workstreamName , linkId : t.linkId });
                    }
                    if(task.List.filter( w => { return w.id == t.linkId && t.linkType == "task"} ).length > 0){
                        let taskName =  task.List.filter( w => { return w.id == t.linkId})[0].task;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : taskName , linkId : t.linkId });
                    }
                })
            }

        return <div>
                    <br/>
                    <div class="col-lg-12 col-md-12">  
                        <h3>New Documents</h3>
                        <table id="dataTable" class="table responsive-table table-bordered document-table">
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Name</th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Uploaded</th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>By</th>
                                    <th>Tags</th>
                                    <th></th>
                                </tr>

                                {(documentList.newUpload.length == 0) && <tr><td colSpan={8}>No Record Found!</td></tr> }
                                { documentList.newUpload.map((data, index) => {
                                    if(loggedUser.data.userRole == 6 && data.uploadedBy != loggedUser.data.id ){
                                        return ;
                                    }else{
                                        return (
                                            <tr key={index}>
                                                <td> 
                                                    <input type="checkbox" 
                                                        // onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }
                                                    />
                                                </td>
                                                <td> 
                                                    {   starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                            ? <span class="glyphicon glyphicon-star" onClick={()=> this.starDocument( data , 1 )} style={{ cursor:"pointer" }}></span>
                                                                : <span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span> 
                                                    }
                                                </td>
                                                <td class="new-document"> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                                                <td>{ moment(data.dateAdded).format('L') }</td>
                                                <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                                <td>
                                                    <ul style={{listStyleType: "none",padding : "0"}}>
                                                        { (tagList.length > 0) &&
                                                            tagList.map((t,tIndex) =>{
                                                                if(t.tagTypeId == data.id){
                                                                    return <li><span key={tIndex} class="label label-primary" style={{margin:"5px"}}>{t.name}</span></li>
                                                                }
                                                            })
                                                        }
                                                    </ul>
                                                </td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "rename" )}>Rename</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                            <li>{ starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                                    ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                                        :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                                }
                                                            </li>
                                                            <li class="dropdown dropdown-library">
                                                                <span class="test" style={{marginLeft : "20px" , color :"#333" , lineHeight: "1.42857143",cursor:"pointer"}}>Move to</span>
                                                                <div class="dropdown-content">
                                                                    {(loggedUser.data.userRole != 6) && // temporary disabled for external users
                                                                        <a href="javascript:void(0)" style={{textDecoration:"none"}} data-tip="Move to library" onClick={()=> this.moveToLibrary(data)}>Move to library</a>
                                                                    }
                                                                    { folder.List.map((f,fIndex) => {
                                                                        return (
                                                                            <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveToFolder(f,data)}>{f.name}</a>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </li>
                                                         
                                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="View" onClick={()=> this.viewDocument(data)}>View</a></li>
                                                            
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                            )
                                        }
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
    }
}