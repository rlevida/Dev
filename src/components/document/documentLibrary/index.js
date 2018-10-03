import React from "react";
import moment from 'moment'
import LibraryDocument from './libraryDocument'
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DropDown , Loading } from "../../../globalComponents"
import { getFilePathExtension , putData , deleteData ,  showToast, postData } from '../../../globalFunction'
import Tooltip from "react-tooltip";
import PrintComponent  from "../print"

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
            folderName : "",
            selectedFilter : 0
        }
    }

    componentDidMount(){
        // automatically move to selected folder
        if(folderParams != "" && folderParamsType == "library"){
            let folderSelectedInterval = setInterval(()=>{
                if(this.props.folder.List.length > 0){
                    clearInterval(folderSelectedInterval)
                    let folderData = this.props.folder.List.filter(e=>e.id == folderParams)
                    if(folderData.length > 0){
                        this.props.dispatch({type:"SET_LIBRARY_FOLDER_SELECTED" , Selected : folderData[0] })
                    }
                }
            },1000)
        }
    }
   
    deleteDocument(id){
        let { dispatch } = this.props;
            if(confirm("Do you really want to delete this record?")){
                putData(`/api/document/${id}`,{isDeleted:1},(c)=>{
                    if(c.status == 200){
                        dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", id:id })
                        showToast("success","Successfully Deleted.");
                   }else{
                       showToast("error","Delete failed. Please try again later.");
                   }
                })
            }
    }

    viewDocument(data){
        let { socket, dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected : data });
    }

    starDocument(data , isStarred){
        let { starred , loggedUser , dispatch } = this.props;
            if(isStarred){
                let id = starred.List.filter( s => { return s.linkId == data.id })[0].id
                    deleteData(`/api/starred/${id}`,{},(c) => {
                        dispatch({ type: "REMOVE_DELETED_STARRED_LIST", id: data.id })
                    }) 
            }else{
                let dataToSubmit = { usersId : loggedUser.data.id , linkType : "project" , linkId : data.id }
                    postData(`/api/starred/`, dataToSubmit, (c) => {
                        dispatch({ type: "ADD_STARRED_LIST", list: c.data })
                    })
            }
    }

    editDocument(data , type , list ){
        let { dispatch } = this.props;
        let newData = { ...data } , tempTags = [];
            if(typeof list != "undefined"){
                if(data.isFolder){
                    list.map( e =>{
                        if( e.tagTypeId == data.id && e.linkType == "workstream" && e.tagType == "folder"){
                            tempTags.push( { value : `workstream-${e.linkId}` , label: e.name })
                        }
                        if( e.tagTypeId == data.id && e.linkType == "task" && e.tagType == "folder"){
                            tempTags.push( { value : `task-${e.linkId}` , label: e.name })
                        }
                    })
                }else{
                    list.map( e =>{
                        if( e.tagTypeId == data.id && e.linkType == "workstream"){
                            tempTags.push( { value : `workstream-${e.linkId}` , label: e.name })
                        }
                        if( e.tagTypeId == data.id && e.linkType == "task"){
                            tempTags.push( { value : `task-${e.linkId}` , label: e.name })
                        }
                    }) 
                }
            }     

            newData = { ...data , tags: JSON.stringify(tempTags) } 

            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected: newData });
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type })
    }

    addFolder(){
        let { loggedUser, folder , dispatch} = this.props;
        let { folderName } = this.state;
        let dataToSubmit = { projectId: project , name: folderName , createdBy: loggedUser.data.id, parentId: folder.SelectedNewFolder.id , type : "library" };
            postData(`/api/folder/`, dataToSubmit, (c) => {
                if(c.status == 200){
                    dispatch({ type: "ADD_FOLDER_LIST", list: c.data });
                    showToast("success","Successfully Added.");
                }else{
                    showToast("error","Saving failed. Please try again.");
                }
                this.setState({ folderAction : "" , folderName : "" });
            })
    }

    // moveItem(id,type){
    //     let { socket , document , loggedUser } = this.props; 
    //         if(typeof document.DocumentToMove.id != "undefined"){
    //             if(confirm("Do you really want to move this file?")){
    //                 if(type == "document"){
    //                     socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data: document.DocumentToMove , userId : loggedUser.data.id, project: project } )
    //                 }else{

    //                 }
    //             }
    //         }
    // }

    // documentToMove(data){
    //     let { dispatch } = this.props;
    //         if(Object.keys(data).length > 0){
    //             dispatch({ type : "SET_DOCUMENT_TO_MOVE" , DocumentToMove : data  })
    //         }else{
    //             dispatch({ type : "SET_DOCUMENT_TO_MOVE" , DocumentToMove : {} })
    //         }
    // }

    moveTo(folderData , documentData){
        let { dispatch } = this.props;
        let dataToSubmit = { ...documentData , status : folderData.type , folderId : folderData.id  };
            putData(`/api/document/${documentData.id}`, dataToSubmit, (c) => {
                if(c.status == 200){
                    dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data })
                    showToast("success","Successfully Updated.")
                }else{
                    showToast("danger","Updating failed. Please try again")
                }
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
            })
    }

    moveFolderTo(folderData , selectedFolder){
        let { dispatch } = this.props;
        let dataToSubmit = { ...selectedFolder , parentId : folderData.id };
            putData(`/api/folder/${selectedFolder.id}`, dataToSubmit, (c) => {
                if(c.status == 200){
                    dispatch({ type: "UPDATE_DATA_FOLDER_LIST", UpdatedData: c.data })
                    showToast("success","Successfully Updated.");
                }else{
                    showToast("error",'Updating failed. Please try again.');
                }
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
            })
    }

    editFolder(data , type){
        let { dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected: data })
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type })
    }

    deleteFolder(id){
        let { dispatch } = this.props;
        if(confirm("Do you really want to delete this folder?")){
            deleteData(`/api/folder/${id}`, { projectId: project }, (c)=>{
                if(c.status == 200){
                    dispatch({ type: "REMOVE_DELETED_FOLDER_LIST", id: id })              
                    showToast("success","Successfully Deleted.");
                }else{
                    showToast("danger","Delete failed. Please try again.");
                }
            })
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
        let dataToSubmit = { 
            users: document.Selected.share , 
                linkType: "project" ,
                linkId : project , 
                shareType : document.Selected.isFolder ? "folder" : "document", 
                shareId : document.Selected.id,
                sharedBy : loggedUser.data.id
        }

        postData(`/api/share/`, dataToSubmit, (c) => {
            if(c.status == 200){
                showToast("success","Successfully Shared.");
            }else{
                showToast("danger","Sharing failed. Please try again.");
            }
        })
    }

    downloadFolder(folder){
        let { document } = this.props;
        let fileList = [];
            document.List.filter( e => {
                if(e.folderId == folder.id){
                    fileList.push({ origin : e.origin , name : e.name })
                }
            })
        window.open(encodeURI(`/api/downloadFolder?data=${JSON.stringify(fileList)}&folderName=${folder.name}`));
    }

    downloadDocument(document){
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    printDocument(file){
        let { dispatch } = this.props;
        dispatch({type:"SET_DOCUMENT_TO_PRINT", DocumentToPrint: encodeURI(`/api/printDocument?fileName=${file.name}&fileOrigin=${file.origin}`)})
        setTimeout(()=>{
            document.getElementById('printDocument').contentWindow.print()
        },3000)
    }
    
    render() {
        let { document , workstream , settings , starred , global , task , folder , dispatch , loggedUser } = this.props , { selectedFilter } = this.state;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] , shareOptions = [] ,folderList = [];

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})
            
            if( document.List.length > 0 && typeof global.SelectList.tagList != "undefined" && typeof global.SelectList.shareList != "undefined" && loggedUser.data.userType != ""){
                if(typeof folder.SelectedLibraryFolder.id == "undefined"){
                    document.List
                        .filter( e => { return e.status == "library" && e.folderId == null})
                        .map( e => {
                            // let tagStatus = global.SelectList.tagList
                            //         .filter( t => { return t.tagTypeId == e.id && t.tagType == "document"})
                            // let isCompleted = tagStatus.length > 0 ? tagStatus[0].isCompleted : 0
                            if( loggedUser.data.userType == "Internal" && !e.isCompleted ){
                                if(e.folderId == null){
                                    if(selectedFilter == 0 ){
                                        documentList.library.push(e)
                                    }else if(selectedFilter == 1 && e.isCompleted == 1){
                                        documentList.library.push(e)
                                    }else if(selectedFilter == 2 && e.isCompleted == 0){
                                        documentList.library.push(e)
                                    }
                                }
                            }else{
                                if(e.folderId == null && !e.isCompleted){
                                    let isShared  = global.SelectList.shareList.filter( s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id  }).length ? 1 : 0 ;
                                        if(isShared || e.uploadedBy == loggedUser.data.id ){
                                            if(selectedFilter == 0 ){
                                                documentList.library.push(e)
                                            }else if(selectedFilter == 1 && e.isCompleted == 1){
                                                documentList.library.push(e)
                                            }else if(selectedFilter == 2 && e.isCompleted == 0){
                                                documentList.library.push(e)
                                            }
                                        }
                                }
                            }
                        })
                }else{
                    document.List
                        .filter( e => { return e.status == "library" && e.folderId != null })
                        .map( e => {
                            if(loggedUser.data.userType == "Internal"){
                                if(e.folderId == folder.SelectedLibraryFolder.id){
                                    if(selectedFilter == 0 ){
                                        documentList.library.push(e)
                                    }else if(selectedFilter == 1 && e.isCompleted == 1){
                                        documentList.library.push(e)
                                    }else if(selectedFilter == 2 && e.isCompleted == 0){
                                        documentList.library.push(e)
                                    }
                                }
                            }else{
                                if(e.folderId == folder.SelectedLibraryFolder.id){
                                    let isShared = global.SelectList.shareList
                                                    .filter( s => { 
                                                        return s.userTypeLinkId == loggedUser.data.id && (s.shareId == e.id || s.shareId == folder.SelectedLibraryFolder.id) && (s.shareType == "document" || s.shareType == "folder") 
                                                    }).length ? 1 : 0 ;
                                        if(isShared || e.uploadedBy == loggedUser.data.id){
                                            if(selectedFilter == 0 ){
                                                documentList.library.push(e)
                                            }else if(selectedFilter == 1 && e.isCompleted == 1){
                                                documentList.library.push(e)
                                            }else if(selectedFilter == 2 && e.isCompleted == 0){
                                                documentList.library.push(e)
                                            }
                                        }
                                    }
                            }
                        })
                }
            }

            if(typeof global.SelectList.tagList != "undefined"){ // FOR TAG OPTIONS
                global.SelectList.tagList.map( t => {
                    if(workstream.List.filter( w => { return w.id == t.linkId && t.linkType == "workstream"} ).length > 0 ){
                        let workstreamName =  workstream.List.filter( w => { return w.id == t.linkId})[0].workstream;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : workstreamName , linkId : t.linkId , tagType : t.tagType });
                    }
                    if(task.List.filter( w => { return w.id == t.linkId && t.linkType == "task" && w.status != "Completed"} ).length > 0){
                        let taskName =  task.List.filter( w => { return w.id == t.linkId})[0].task;
                            tagList.push({ linkType: t.linkType , tagTypeId: t.tagTypeId  , name : taskName , linkId : t.linkId , tagType : t.tagType });
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
                        if(e.type == "library"){
                            folderList.push(e)
                        }
                    })
                }else{
                    if(typeof global.SelectList.shareList != "undefined" && typeof loggedUser.data.id != "undefined"){
                        folder.List.map( e =>{
                            if(e.type == "library"){
                                let isShared = global.SelectList.shareList.filter( s =>{ return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id &&  s.shareType == "folder" && e.type == "library" }).length ? 1 : 0
                                    if(isShared || e.createdBy == loggedUser.data.id ){
                                        folderList.push(e)
                                    }
                            }
                        })
                    }
                }
            }

            let folderName = [];
            folderName.unshift(<span>{(typeof folder.SelectedLibraryFolder.name != "undefined" && folder.SelectedLibraryFolder.type == "library")?` > ${folder.SelectedLibraryFolder.name}`:""}</span>)
            let folderParentId = folder.SelectedLibraryFolder.parentId;
            while( folderParentId ){
                let parentFolder = folderList.filter(e=>e.id == folderParentId);
                folderParentId = null;
                if(parentFolder.length > 0){
                    folderName.unshift(<span> > <a style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_LIBRARY_FOLDER_SELECTED" , Selected : parentFolder[0] })}>{
                    ((typeof parentFolder[0].name != "undefined")?`${parentFolder[0].name}`:"")}</a></span>)
                    folderParentId = parentFolder[0].parentId;
                }
            }
        return  <div>
                    <div class="col-lg-12 col-md-12">
                        <h3><a style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_LIBRARY_FOLDER_SELECTED" , Selected : {} })}>Library</a>
                        { folderName.map((e,index)=>{ return <span key={index}>{e}</span>; }) } 
                        </h3>

                        { (this.state.folderAction == "") &&
                            <form > 
                                 <div class="form-group">
                                    <div class="col-lg-1 col-md-1 col-sm-1">
                                        <a href="javascript:void(0)" title="New Folder" style={{textDecoration:"none"}} onClick={()=> this.setState({ folderAction : "create" })}><span class="fa fa-folder fa-3x"></span></a>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <div class="col-lg-2 col-md-2 col-sm-2">
                                        <DropDown 
                                            multiple={false} 
                                            required={false}
                                            options={ [{id : 0 , name : "All"},{ id : 1 ,name : "Completed"},{ id : 2 ,name : "Uncompleted"}] } 
                                            selected={ this.state.selectedFilter } 
                                            onChange={(e)=> this.setState({selectedFilter : e.value})} /> 
                                    </div>
                                </div>
                            </form>
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
                                    (document.Loading) && 
                                        <tr>
                                            <td colSpan={8}><Loading/></td>
                                        </tr>
                                }
                                {
                                    (documentList.library.length == 0 && folder.List.length == 0 && !document.Loading) &&
                                        <tr>
                                            <td colSpan={8}>No Record Found!</td>
                                        </tr>
                                }
                                { (!document.Loading) &&
                                    folderList.map((data, index) => {
                                        if( (!data.parentId && !folder.SelectedLibraryFolder.id) || (data.parentId && folder.SelectedLibraryFolder.id == data.parentId)){
                                            return (
                                                // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id , "folder")} documentToMove={(data)=> this.documentToMove(data)} docType="folder"/>
                                                <tr key={index}>
                                                    <td><input type="checkbox"/></td>
                                                    <td ><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span></td>
                                                    <td class="library-document"><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_LIBRARY_FOLDER_SELECTED" , Selected : data })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{data.name}</a></td>
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
                                                    <td> 
                                                        <ul style={{listStyleType: "none",padding : "0"}}>  
                                                            { (tagList.length > 0) &&
                                                                tagList.map((t,tIndex) =>{
                                                                    if(t.tagTypeId == data.id && t.tagType == "folder"){
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
                                                                { (loggedUser.data.userType == "Internal") &&
                                                                    <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={()=>dispatch({type:"SET_DOCUMENT_SELECTED", Selected:data })}>Share</a></li>
                                                                }
                                                                <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.downloadFolder(data)}>Download</a></li>
                                                                <li class="dropdown dropdown-library">
                                                                        <span class="test" style={{marginLeft : "20px" , color :"#333" , lineHeight: "1.42857143",cursor:"pointer"}}>Move to</span>
                                                                        <div class="dropdown-content">
                                                                            {(typeof folder.SelectedLibraryFolder.id != "undefined") &&
                                                                                <a href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo({id: null},data)}>Library</a>
                                                                            }
                                                                            { folder.List.map((f,fIndex) => {
                                                                                if(f.type == "library"){
                                                                                    if(typeof folder.SelectedLibraryFolder.id == "undefined" && f.id != data.id){
                                                                                        return (
                                                                                            <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo(f,data)}>{`${f.name} ${ f.type == "new" ? "( new document )" : "( library )"}`} </a>
                                                                                        )
                                                                                    }else{
                                                                                        if(folder.SelectedLibraryFolder.id != f.id &&  f.id != data.id){
                                                                                            return (
                                                                                                <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo(f,data)}>{f.name}</a>
                                                                                            )
                                                                                        }
                                                                                    }
                                                                                }
                                                                            })}
                                                                        </div>
                                                                </li>
                                                                {/* <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editFolder(data , "folder")}>Rename</a></li> */}
                                                                <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteFolder(data.id)}>Delete</a></li>
                                                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    })
                                }
                                { (!document.Loading) &&
                                    documentList.library.map((data, index) => {
                                        let ext  = getFilePathExtension(data.origin)
                                        let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
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
                                                <td  class="library-document"><a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ documentName }</a></td>
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
                                                                        {(typeof folder.SelectedLibraryFolder.id != "undefined") &&
                                                                            <a href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo({id: null},data)}>Library</a>
                                                                        }
                                                                        { folder.List.map((f,fIndex) => {
                                                                            if(f.type == "library"){
                                                                                if(typeof folder.SelectedLibraryFolder.id == "undefined"){
                                                                                    return (
                                                                                        <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name}</a>
                                                                                    )
                                                                                }else{
                                                                                    if(folder.SelectedLibraryFolder.id != f.id){
                                                                                        return (
                                                                                            <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name}</a>
                                                                                        )
                                                                                    }
                                                                                }
                                                                            }
                                                                        })}
                                                                    </div>
                                                            </li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Download" onClick={()=> this.downloadDocument(data)}>Download</a></li>
                                                            <li>
                                                            { starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                                    ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                                        :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                            }
                                                            </li>
                                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                            <li><a href="javascript:void(0);" data-tip="Print" onClick={()=>this.printDocument(data)}>Print</a></li>
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
                    <PrintComponent/>
                </div>
    }
}