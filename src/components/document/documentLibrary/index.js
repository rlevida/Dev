import React from "react";
import moment from 'moment'
import LibraryDocument from './libraryDocument'
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

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
        let { socket , global } = this.props;
        let { folderName } = this.state;
            socket.emit("SAVE_OR_UPDATE_FOLDER", { data:{ projectId: project , name: folderName }})
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
    

    render() {
        let { document , workstream , settings , starred , global , task , folder , dispatch } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] ;

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

            if(typeof folder.Selected.id == "undefined"){
                if( document.List.length > 0 ){
                    document.List.filter( e =>{
                        if( e.status == "new" && e.isCompleted != 1 ){
                            documentList.newUpload.push(e)
                        }
                        if( e.status == "library" && e.isCompleted != 1 && e.folderId == null){
                            documentList.library.push(e)
                        }
                    })
                }
            }else{
                document.List.filter( e =>{
                    if( e.status == "library" && e.isCompleted != 1 && e.folderId == folder.Selected.id){
                        documentList.library.push(e)
                    }
                })
            }

            if(typeof global.SelectList.tagList != "undefined"){
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

        return  <div>
                    <div class="col-lg-12 col-md-12">
                        <h3 style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_FOLDER_SELECTED" , Selected : {} })}>Library { typeof folder.Selected.name != "undefined" && ` > ${folder.Selected.name}` } </h3>
                        { this.state.folderAction == "" &&
                            <a href="javascript:void(0)" title="New Folder" style={{textDecoration:"none"}} onClick={()=> this.setState({ folderAction : "create" })}><span class="fa fa-folder fa-2x"></span></a>
                        }
                        { this.state.folderAction == "create" &&
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
                                    folder.List.map((data, index) => {
                                        return (
                                            // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id , "folder")} documentToMove={(data)=> this.documentToMove(data)} docType="folder"/>
                                            <tr>
                                                <td><input type="checkbox"/></td>
                                                <td><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span></td>
                                                <td><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_FOLDER_SELECTED" , Selected : data })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{data.name}</a></td>
                                                <td>{moment(data.dateUpdated).format('L')}</td>
                                                <td></td>
                                                <td></td>
                                                <td></td>
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
                                            <td><a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                                                <td>{ moment(data.dateUpdated).format('L') }</td>
                                                <td><i class="fa fa-users"></i></td>
                                                <td> 
                                                    { (tagList.length > 0) &&
                                                        tagList.map((t,tIndex) =>{
                                                            if(t.tagTypeId == data.id){
                                                                return <span key={tIndex} class="label label-primary" style={{margin:"5px"}}>{t.name}</span>
                                                            }
                                                        })
                                                    }
                                                </td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href="javascript:void(0)" onClick={()=> this.viewDocument(data)}>View</a></li>
                                                            <li class="dropdown dropdown-library">
                                                                    <span class="test" style={{marginLeft : "20px" , color :"#333" , lineHeight: "1.42857143",cursor:"pointer"}}>Move to</span>
                                                                    <div class="dropdown-content">
                                                                        { folder.List.map((f) => {
                                                                            return (
                                                                                <a href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name}</a>
                                                                            )
                                                                        })}
                                                                    </div>
                                                            </li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                            <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                                            <li>
                                                            {
                                                                starred.List.filter( s => { return s.linkId == data.id }).length > 0 
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
                    </div>
                </div>
    }
}