import React from "react";
import { Loading } from "../../../globalComponents"
import { getFilePathExtension } from '../../../globalFunction'
import moment from 'moment'
import Tooltip from "react-tooltip";

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
            files : [],
            folderAction : ""
        }
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }
    
    componentDidMount(){
        // automatically move to selected folder
        if(folderParams != "" && folderParamsType == "new"){
            let folderSelectedInterval = setInterval(()=>{
                if(this.props.folder.List.length > 0){
                    clearInterval(folderSelectedInterval)
                    let folderData = this.props.folder.List.filter(e=>e.id == folderParams)
                    if(folderData.length > 0){
                        this.props.dispatch({type:"SET_NEW_FOLDER_SELECTED" , Selected : folderData[0] })
                    }
                }
            },1000)
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
                    if( e.tagTypeId == data.id && e.linkType == "workstream" && e.tagType == "document"){
                        tempTags.push( { value : `workstream-${e.linkId}` , label: e.name })
                    }
                    if( e.tagTypeId == data.id && e.linkType == "task" && e.tagType == "document"){
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
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data :{ ...documentData , status : folderData.type , folderId : folderData.id , isCompleted : 1 } , type : "project"})
    }

    addFolder(){
        let { socket , global , loggedUser, folder } = this.props;
        let { folderName } = this.state;
            socket.emit("SAVE_OR_UPDATE_FOLDER", { data:{ projectId: project , name: folderName , createdBy: loggedUser.data.id, parentId: folder.SelectedNewFolder.id , type : "new" }})
            this.setState({ folderAction : "" , folderName : "" })
    }

    render() {
        let { document , workstream , settings , starred , global , task , folder , dispatch , loggedUser , users } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] , shareOptions = [] , tagCount = 0;
        let folderList = [];
           
            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})
            
            if(typeof folder.SelectedNewFolder.id == "undefined" && folder.SelectedNewFolder.type != "new" && typeof global.SelectList.tagList != "undefined"){
                if( document.List.length > 0 ){
                    document.List.filter( e =>{
                        let tagStatus = global.SelectList.tagList
                            .filter( t => { return t.tagTypeId == e.id && t.tagType == "document"})
                        let isCompleted = tagStatus.length > 0 ? tagStatus[0].isCompleted : 0

                        if( loggedUser.data.userType == "Internal" && !isCompleted){
                            if( e.status == "new"){
                                documentList.newUpload.push(e)
                            }
                        }else{
                            if( e.status == "new" &&  !isCompleted ){
                                let isShared  = global.SelectList.shareList.filter( s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id }).length ? 1 : 0 ;
                                    if(isShared || e.uploadedBy == loggedUser.data.id){
                                        documentList.newUpload.push(e)
                                    }
                            }
                        }
                    })
                }
            }else if( folder.SelectedNewFolder.type == "new"){
                document.List.filter( e =>{
                    let tagStatus = global.SelectList.tagList
                            .filter( t => { return t.tagTypeId == e.id && t.tagType == "document"})
                        let isCompleted = tagStatus.length > 0 ? tagStatus[0].isCompleted : 0

                    if(loggedUser.data.userType == "Internal" && !isCompleted){
                        if( e.status == "new" && e.folderId == folder.SelectedNewFolder.id){
                            documentList.newUpload.push(e)
                        }
                    }else{
                        if(e.status == "new" && e.folderId == folder.SelectedNewFolder.id && !isCompleted){
                            let isShared = global.SelectList.shareList
                                            .filter( s => { return s.userTypeLinkId == loggedUser.data.id && (s.shareId == e.id || s.shareId == folder.SelectedNewFolder.id) && (s.shareType == "document" || s.shareType == "folder")}).length 
                                                ? 1 : 0 ;
                                if(isShared || e.uploadedBy == loggedUser.data.id){
                                    documentList.newUpload.push(e)
                                }
                            }
                    }
                })
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
                        if(e.type == "new"){
                            folderList.push(e)
                        }
                    })
                }else{
                    if(typeof global.SelectList.shareList != "undefined" && typeof loggedUser.data.id != "undefined"){
                        folder.List.map( e =>{
                            let isShared = global.SelectList.shareList.filter( s =>{ return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id &&  s.shareType == "folder"}).length ? 1 : 0
                                if((isShared || e.createdBy == loggedUser.data.id) && e.type == "new" ) {
                                    folderList.push(e)
                                }
                        })
                    }
                }
            }

            let folderName = [];
            folderName.unshift(<span>{(typeof folder.SelectedNewFolder.name != "undefined" && folder.SelectedNewFolder.type == "new")?` > ${folder.SelectedNewFolder.name}`:""}</span>)
            let folderParentId = folder.SelectedNewFolder.parentId;
            while( folderParentId ){
                let parentFolder = folderList.filter(e=>e.id == folderParentId);
                folderParentId = null;
                if(parentFolder.length > 0){
                    folderName.unshift(<span> > <a style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_FOLDER_SELECTED" , Selected : parentFolder[0] })}>{
                    ((typeof parentFolder[0].name != "undefined")?`${parentFolder[0].name}`:"")}</a></span>)
                    folderParentId = parentFolder[0].parentId;
                }
            }
        return <div>
                    <br/>
                    <div class="col-lg-12 col-md-12">  
                    <h3>
                        <a style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_NEW_FOLDER_SELECTED" , Selected : {} })}>New Documents</a>
                        { folderName.map((e,index)=>{ return <span key={index}>{e}</span> }) } 
                    </h3>
                        { (this.state.folderAction == "") &&
                            <div class="form-group">
                                <div class="col-lg-1 col-md-1 col-sm-1">
                                    <a href="javascript:void(0)" title="New Folder" style={{textDecoration:"none"}} onClick={()=> this.setState({ folderAction : "create" })}><span class="fa fa-folder fa-3x"></span></a>
                                 </div>
                            </div>
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
                                { 
                                    (document.Loading) &&
                                        <tr>
                                            <td colSpan={8}><Loading/></td>
                                        </tr> 
                                }
                                {
                                    (documentList.newUpload.length == 0 && folderList.length == 0 && !document.Loading) && 
                                        <tr>
                                            <td colSpan={8}>No Record Found!</td>
                                        </tr> 
                                }
                                
                                { (!document.Loading) &&
                                    folderList.map((data, index) => {
                                        if( (!data.parentId && !folder.SelectedNewFolder.id) || (data.parentId && folder.SelectedNewFolder.id == data.parentId)){
                                            return (
                                                // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id , "folder")} documentToMove={(data)=> this.documentToMove(data)} docType="folder"/>
                                                <tr key={index}>
                                                    <td><input type="checkbox"/></td>
                                                    <td ><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span></td>
                                                    <td class="library-document"><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_NEW_FOLDER_SELECTED" , Selected : data })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{data.name}</a></td>
                                                    <td>{moment(data.dateUpdated).format('L')}</td>
                                                    <td> { users.List.map((e,mIndex) => { if(data.createdBy== e.id){ return e.emailAddress} }) }
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
                                                                            {(typeof folder.SelectedNewFolder.id != "undefined") &&
                                                                                <a href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo({id: null},data)}>Library</a>
                                                                            }
                                                                            { folder.List.map((f,fIndex) => {
                                                                                if(typeof folder.SelectedNewFolder.id == "undefined" && f.id != data.id){
                                                                                    return (
                                                                                        <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo(f,data)}>{f.name}</a>
                                                                                    )
                                                                                }else{
                                                                                    if(folder.SelectedNewFolder.id != f.id &&  f.id != data.id){
                                                                                        return (
                                                                                            <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo(f,data)}>{f.name}</a>
                                                                                        )
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

                                { documentList.newUpload.map((data, index) => {
                                    let ext  = getFilePathExtension(data.origin)
                                    let documentName = `${data.origin.split(`.${ext}`).join("")}${data.documentNameCount > 0 ? `(${data.documentNameCount}).${ext}` : `.${ext}`}`
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
                                            <td class="new-document"> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ documentName }</a></td>
                                            <td>{ moment(data.dateAdded).format('L') }</td>
                                            <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                            <td>
                                                { (tagList.length > 0) &&
                                                    tagList.map((t,tIndex) =>{
                                                        tagCount += t.name.length
                                                        if(t.tagTypeId == data.id && t.tagType == "document"){
                                                            let tempCount = tagCount ; 
                                                                if(tagCount > 16 ){ tagCount = 0}
                                                                return <span key={tIndex} ><label class="label label-primary" style={{margin:"5px"}}>{t.name}</label>{tempCount > 16  && <br/>}</span>
                                                        }
                                                    })
                                                }
                                            </td>
                                            <td>
                                                <div class="dropdown">
                                                    <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                    <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                        { (loggedUser.data.userType == "Internal") &&
                                                            <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={()=>dispatch({type:"SET_DOCUMENT_SELECTED", Selected:data })}>Share</a></li>
                                                        }
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
                                                                {(loggedUser.data.userRole != 6) &&
                                                                    <a href="javascript:void(0)" style={{textDecoration:"none"}} data-tip="Move to library" onClick={()=> this.moveToLibrary(data)}>Move to library</a>
                                                                }
                                                                { folder.List.map((f,fIndex) => {
                                                                    return (
                                                                        <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveToFolder(f,data)}>{f.name} {`${ f.type == "new" ? "( new document )" : "( library )"}`}</a>
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
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
    }
}