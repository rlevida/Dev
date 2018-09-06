import React from "react";
import moment from 'moment'
import LibraryDocument from './libraryDocument'
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DropDown } from "../../../globalComponents"
import Tooltip from "react-tooltip";

import { connect } from "react-redux"

@DragDropContext(HTML5Backend)

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


export default class DocumentLibrary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : [] , 
            upload : false,
            loading : false,
            tags : [],
            files : [],
            folderAction : "",
            folderName : ""
        }
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

    archiveData(id){
        let { socket } = this.props;
            if(confirm("Do you really want to archive this record?")){
                socket.emit("ARCHIVE_DOCUMENT",{id:id});
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

    addFolder(){
        let { socket , global , loggedUser } = this.props;
        let { folderName } = this.state;
            socket.emit("SAVE_OR_UPDATE_FOLDER", { data:{ projectId: project , name: folderName , createdBy: loggedUser.data.id }})
            this.setState({ folderAction : "" , folderName : "" })
    }

    moveItem(id,type){
        let { socket , document , loggedUser } = this.props; 
            if(typeof document.DocumentToMove.id != "undefined"){
                if(confirm("Do you really want to move this file?")){
                    if(type == "document"){
                        socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data: document.DocumentToMove , userId : loggedUser.data.id, project: project } )
                    }else{

                    }
                }
            }
    }

    documentToMove(data){
        let { dispatch } = this.props;
            if(Object.keys(data).length > 0){
                dispatch({ type : "SET_DOCUMENT_TO_MOVE" , DocumentToMove : data  })
            }else{
                dispatch({ type : "SET_DOCUMENT_TO_MOVE" , DocumentToMove : {} })
            }
    }

    moveTo(folderData , documentData){
        let { socket } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data :{ ...documentData , folderId : folderData.id } , type : "project"})
    }

    editFolder(data , type){
        let { dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected: data })
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type })
    }

    deleteFolder(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this folder?")){
            socket.emit("DELETE_FOLDER",{ filter :{ id:id , projectId:project }});
        }
    }

    selectShare(e , data){
        let { dispatch , document } = this.props;
        let Selected = Object.assign({},document.Selected);
            Selected["share"] = JSON.stringify(e)
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected:Selected})
    }

    share(){
        let { socket , document , loggedUser } = this.props;
            socket.emit("SAVE_OR_UPDATE_SHARED_DOCUMENT", { 
                data: document.Selected.share , 
                linkType: "project" ,
                linkId : project , 
                shareType : document.Selected.isFolder ? "folder" : "document", 
                shareId : document.Selected.id,
                sharedBy : loggedUser.data.id
            })
    }

    render() {
        let { document , workstream , settings , starred , global , task , folder , dispatch , loggedUser } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] , shareOptions = [] ;
        let folderList = [];

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

            if(typeof folder.Selected.id == "undefined"){
                if( document.List.length > 0 ){
                    document.List.filter( e =>{
                        if( loggedUser.data.userType == "Internal"){
                            if( e.status == "new" && e.isCompleted != 1 ){
                                documentList.newUpload.push(e)
                            }
                            if( e.status == "library" && e.folderId == null){
                                documentList.library.push(e)
                            }
                        }else{
                            if(e.status == "library" && e.folderId == null){
                                let isShared  = global.SelectList.shareList.filter( s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id  }).length ? 1 : 0 ;
                                    if(isShared || e.uploadedBy == loggedUser.data.id ){
                                        documentList.library.push(e)
                                    }
                            }
                        }
                    })
                }
            }else{
                document.List.filter( e =>{
                    if(loggedUser.data.userType == "Internal"){
                        if( e.status == "library" && e.folderId == folder.Selected.id){
                            documentList.library.push(e)
                        }
                    }else{
                        if(e.status == "library" && e.folderId == folder.Selected.id){
                            let isShared  = global.SelectList.shareList.filter( s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id && s.shareType == "document" }).length ? 1 : 0 ;
                                if(isShared){
                                    documentList.library.push(e)
                                }
                            }
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

            if(typeof global.SelectList.ProjectMemberList != "undefined"){ // FOR SHARE OPTIONS
                global.SelectList.ProjectMemberList.map(e =>{ 
                    if(e.userType == "External"){
                        shareOptions.push({ id: e.id , name : `${e.firstName} ${e.lastName}` })
                    }
                }) 
            }

            if(folder.List.length > 0){
                if(loggedUser.data.userType == "Internal"){
                    folder.List.map( e =>{
                        folderList.push(e)
                    })
                }else{
                    if(typeof global.SelectList.shareList != "undefined" && typeof loggedUser.data.id != "undefined"){
                        folder.List.map( e =>{
                            let isShared = global.SelectList.shareList.filter( s =>{ return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id &&  s.shareType == "folder"}).length ? 1 : 0
                                if(isShared || e.createdBy == loggedUser.data.id ){
                                    folderList.push(e)
                                }
                        })
                    }
                }
            }

        return  <div>
                    <div class="col-lg-12 col-md-12">
                        <h3 style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_FOLDER_SELECTED" , Selected : {} })}>Library { typeof folder.Selected.name != "undefined" && ` > ${folder.Selected.name}` } </h3>
                        { (this.state.folderAction == "" && typeof folder.Selected.id == "undefined") &&
                            <a href="javascript:void(0)" title="New Folder" style={{textDecoration:"none"}} onClick={()=> this.setState({ folderAction : "create" })}><span class="fa fa-folder fa-2x"></span></a>
                        }
                        { (this.state.folderAction == "create") &&
                            <form class="form-inline">
                                <div class="form-group">
                                    <input class="form-control" type="text" name="folderName" placeholder="Enter folder name" onChange={(e)=> this.setState({ [e.target.name] : e.target.value })} value={this.state.folderName}/>
                                    <a href="javascript:void(0)" class="btn btn-primary" style={{margin:"5px"}} onClick={()=> this.addFolder()}>Add</a>
                                    <a href="javascript:void(0)" class="btn btn-primary" style={{margin:"5px"}} onClick={()=> this.setState({ folderAction : "" })}>Cancel</a>
                                </div>
                            </form>
                        }
                        <table id="dataTable" class="table responsive-table table-bordered document-table" ref={el => (this.componentRef = el)}>
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Name</th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Modified</th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Members</th>
                                    <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Tags</th>
                                    <th></th>
                                </tr>
                                {
                                    (documentList.library.length == 0 && folder.List.length == 0) &&
                                    <tr>
                                        <td colSpan={8}>No Record Found!</td>
                                    </tr>
                                }
                               
                                { (typeof folder.Selected.id == "undefined") &&
                                    folderList.map((data, index) => {
                                        return (
                                            // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id , "folder")} documentToMove={(data)=> this.documentToMove(data)} docType="folder"/>
                                            <tr key={index}>
                                                <td><input type="checkbox"/></td>
                                                <td ><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span></td>
                                                <td class="library-document"><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_FOLDER_SELECTED" , Selected : data })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{data.name}</a></td>
                                                <td>{moment(data.dateUpdated).format('L')}</td>
                                                <td>
                                                    <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                                    <Tooltip id={`follower${index}`}>
                                                        { global.SelectList.ProjectMemberList.map((e,mIndex) => {
                                                            if( e.userType == "Internal"){
                                                                return <p key={mIndex}>{ `${e.firstName} ${e.lastName}`} <br/></p>
                                                            }else{
                                                                if(global.SelectList.shareList.length > 0){
                                                                    let isShared =  global.SelectList.shareList.filter(s => {return s.userTypeLinkId == e.id && data.id == s.shareId && s.shareType == "folder"}).length ? 1 : 0
                                                                        if(isShared){
                                                                            return <p key={mIndex}>{ `${e.firstName} ${e.lastName}`} <br/></p>
                                                                        }
                                                                }
                                                            }
                                                        })}
                                                    </Tooltip>
                                                </td>
                                                <td></td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            { (loggedUser.data.userType == "Internal") &&
                                                                <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={()=>dispatch({type:"SET_DOCUMENT_SELECTED", Selected:data })}>Share</a></li>
                                                            }
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editFolder(data , "folder")}>Rename</a></li>
                                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteFolder(data.id)}>Delete</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                                {
                                    documentList.library.map((data, index) => {
                                        return (
                                            // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id ,"document")} documentToMove={(data)=> this.documentToMove(data)} docType="document"/>
                                            <tr key={index}>
                                                <td> 
                                                    <input type="checkbox" 
                                                        // onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }
                                                    />
                                                </td>
                                                <td> 
                                                    {
                                                        starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                            ? <span class="glyphicon glyphicon-star" onClick={()=> this.starDocument( data , 1 )} style={{ cursor:"pointer" }}></span>
                                                                : <span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span> 
                                                    }
                                                </td>
                                                <td  class="library-document"><a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                                                <td>{ moment(data.dateUpdated).format('L') }</td>
                                                <td>
                                                    <div>
                                                        <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                                        <Tooltip id={`follower${index}`}>
                                                            { global.SelectList.ProjectMemberList.map((e,mIndex) => {
                                                                if( e.userType == "Internal"){
                                                                    return <p key={mIndex}>{ `${e.firstName} ${e.lastName}`} <br/></p>
                                                                }else{
                                                                    if(global.SelectList.shareList.length > 0){
                                                                        let isShared =  global.SelectList.shareList.filter(s => {return s.userTypeLinkId == e.id && data.id == s.shareId && s.shareType == "document"}).length ? 1 : 0
                                                                            if(isShared){
                                                                                return <p key={mIndex}>{ `${e.firstName} ${e.lastName}`} <br/></p>
                                                                            }
                                                                    }
                                                                }
                                                            })}
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                                <td> 
                                                    <ul style={{listStyleType: "none",padding : "0"}}>  
                                                        { (tagList.length > 0) &&
                                                            tagList.map((t,tIndex) =>{
                                                                if(t.tagTypeId == data.id){
                                                                    return <li key={tIndex}><span key={tIndex} class="label label-primary" style={{margin:"5px"}}>{t.name}</span></li>
                                                                }
                                                            })
                                                        }
                                                    </ul>
                                                </td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href="javascript:void(0)" onClick={()=> this.viewDocument(data)}>View</a></li>
                                                            { (loggedUser.data.userType == "Internal") &&
                                                                <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={()=>dispatch({type:"SET_DOCUMENT_SELECTED", Selected:data })}>Share</a></li>
                                                            }
                                                            <li class="dropdown dropdown-library">
                                                                    <span class="test" style={{marginLeft : "20px" , color :"#333" , lineHeight: "1.42857143",cursor:"pointer"}}>Move to</span>
                                                                    <div class="dropdown-content">
                                                                        {(typeof folder.Selected.id != "undefined") &&
                                                                            <a href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo({id: null},data)}>Library</a>
                                                                        }
                                                                        { folder.List.map((f,fIndex) => {
                                                                            if(typeof folder.Selected.id == "undefined"){
                                                                                return (
                                                                                    <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name}</a>
                                                                                )
                                                                            }else{
                                                                                if(folder.Selected.id != f.id){
                                                                                    return (
                                                                                        <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name}</a>
                                                                                    )
                                                                                }
                                                                            }
                                                                        })}
                                                                    </div>
                                                            </li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                            <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                                            <li>
                                                            { starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                                    ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                                        :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                            }
                                                            </li>
                                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                            <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Print">Print</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                        <div class="modal fade" id="shareModal" tabIndex="-1" role="dialog" aria-labelledby="shareModalLabel" aria-hidden="true">
                            <div class="modal-dialog" role="document">
                                <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="shareModal">Share</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <div class="form-group">
                                        <div class="col-md-12 col-xs-12">
                                            <DropDown 
                                                name="share"
                                                multiple={true}
                                                required={false}
                                                options={ shareOptions } 
                                                selected={ ( document.Selected.share != null ) ? JSON.parse(document.Selected.share) : []  } 
                                                onChange={(e)=>this.selectShare(e , document.Selected )} 
                                                /> 
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                    <br/>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    { ( document.Selected.share != null) && 
                                        <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={ () => this.share() }>Share</button>
                                    }
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
    }
}