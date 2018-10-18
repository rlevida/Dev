import React from "react";
import { DropDown , Loading } from "../../../globalComponents"
import { getFilePathExtension , putData , deleteData ,  showToast, postData , removeTempFile } from '../../../globalFunction'
import moment from 'moment'
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
            folderAction : "",
            selectedFilter : 0
        }
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

    moveToLibrary(data){
        let { socket , dispatch } = this.props;
        let dataToSubmit = { status : "library" , id : data.id }
            putData(`/api/document/${data.id}`, dataToSubmit, (c)=>{
                if(c.status == 200){
                    dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data })
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                    showToast("success","Successfully Updated.")
                }else{
                    showToast("error","Updating failed. Please try again.")
                }
            })
    }

    moveFolderTo(folderData , selectedFolder){
        let { dispatch } = this.props;
        let dataToSubmit = { ...selectedFolder , parentId : folderData.id  };
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

    addFolder(){
        let { loggedUser, folder , dispatch} = this.props;
        let { folderName } = this.state;
        let dataToSubmit = { projectId: project , name: folderName , createdBy: loggedUser.data.id, parentId: folder.SelectedNewFolder.id , type : "new" };
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

    // printDocument(data){
    //     let { dispatch } = this.props
    //     getData(`/api/document/getPrinterList`,{},(c) => {
    //         dispatch({ type : "SET_PRINTER_LIST" , List: c.data })
    //         dispatch({ type : "SET_DOCUMENT_SELECTED" , Selected: data })
    //         $(`#printerModal`).modal("show")
    //     })
    // }


    printDocument(file){ 
        let { dispatch } = this.props; 
        let dataToSubmit = { fileName : file.name , fileOrigin : file.origin };
        postData(`/api/document/printDocument`, dataToSubmit, (c) => {
                document.getElementById("printDocument").src = `/temp/${c.data}`;
                setTimeout(()=>{ 
                    document.getElementById('printDocument').contentWindow.print();

                    let onFocus = true
                    window.onfocus = function(){ 
                        if( onFocus ){
                            removeTempFile(c.data, (c) => { onFocus = false  })
                        }
                    }
                },2000) 
        })
    }

    downloadDocument(document){
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    render() {
        let { document , workstream , settings , starred , global , task , folder , dispatch , loggedUser , users } = this.props , { selectedFilter } = this.state;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] , shareOptions = [] , tagCount = 0;
        let folderList = [];
            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})
            if(typeof folder.SelectedNewFolder.id == "undefined" && folder.SelectedNewFolder.type != "new" 
                && typeof global.SelectList.tagList != "undefined" && typeof global.SelectList.shareList != "undefined" && loggedUser.data.userType != ""){
                if( document.List.length > 0 ){
                    document.List
                        .filter( e => { return e.status == "new"})
                        .map( e => {
                            // let tagStatus = global.SelectList.tagList
                            //     .filter( t => { return t.tagTypeId == e.id && t.tagType == "document"})
                            // let isCompleted = tagStatus.length > 0 ? tagStatus[0].isCompleted : 0
                            if( loggedUser.data.userType == "Internal"){
                                if(e.folderId == null){
                                    if(selectedFilter == 0 ){
                                        documentList.newUpload.push(e)
                                    }else if(selectedFilter == 1 && e.isCompleted == 1){
                                        documentList.newUpload.push(e)
                                    }else if(selectedFilter == 2 && e.isCompleted == 0){
                                        documentList.newUpload.push(e)
                                    }
                                }
                            }else{
                                if(e.folderId == null ){
                                    let isShared  = global.SelectList.shareList.filter( s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id }).length ? 1 : 0 ;
                                        if(isShared || e.uploadedBy == loggedUser.data.id){
                                            if(selectedFilter == 0 ){
                                                documentList.newUpload.push(e)
                                            }else if(selectedFilter == 1 && e.isCompleted == 1){
                                                documentList.newUpload.push(e)
                                            }else if(selectedFilter == 2 && e.isCompleted == 0){
                                                documentList.newUpload.push(e)
                                            }
                                        }
                                }
                            }
                        })
                }
            }else if( folder.SelectedNewFolder.type == "new"){
                document.List
                    .filter( e => { return e.status == "new" && e.folderId != null })
                    .map( e => { 
                        let tagStatus = global.SelectList.tagList.filter( t => { return t.tagTypeId == e.id && t.tagType == "document"})
                        let isCompleted = tagStatus.length > 0 ? tagStatus[0].isCompleted : 0

                            if(loggedUser.data.userType == "Internal" && !e.isCompleted && e.status == "new"){
                                if(e.folderId == folder.SelectedNewFolder.id){
                                    if(selectedFilter == 0 ){
                                        documentList.newUpload.push(e)
                                    }else if(selectedFilter == 1 && e.isCompleted == 1){
                                            documentList.newUpload.push(e)
                                    }else if(selectedFilter == 2 && e.isCompleted == 0){
                                        documentList.newUpload.push(e)
                                    }
                                }
                            }else if(e.status == "new" && e.folderId == folder.SelectedNewFolder.id && !e.isCompleted){
                                let isShared = global.SelectList.shareList
                                    .filter( s => { return s.userTypeLinkId == loggedUser.data.id && (s.shareId == e.id || s.shareId == folder.SelectedNewFolder.id) && (s.shareType == "document" || s.shareType == "folder")}).length 
                                        ? 1 : 0 ;
                                if(isShared || e.uploadedBy == loggedUser.data.id){
                                    if(selectedFilter == 0 ){
                                        documentList.newUpload.push(e)
                                    }else if(selectedFilter == 1 && e.isCompleted == 1){
                                            documentList.newUpload.push(e)
                                    }else if(selectedFilter == 2 && e.isCompleted == 0){
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
                    folderName.unshift(<span> > <a style={{cursor: "pointer"}} onClick={()=>dispatch({type:"SET_NEW_FOLDER_SELECTED" , Selected : parentFolder[0] })}>{
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
                                                                                        <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveFolderTo(f,data)}>{`${f.name} ${ f.type == "new" ? "( new document )" : "( library )"}`}</a>
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
                                { (!document.Loading) &&
                                    documentList.newUpload.map((data, index) => {
                                        let ext  = getFilePathExtension(data.origin)
                                        let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
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
                                                            <li><a href="javascript:void(0)" data-tip="Download" onClick={()=>this.downloadDocument(data)}>Download</a></li>
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
                                                                            <a key={fIndex} href="javascript:void(0)" style={{textDecoration:"none"}} onClick={()=> this.moveTo(f,data)}>{f.name} {`${ f.type == "new" ? "( new document )" : "( library )"}`}</a>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </li>
                                                            
                                                            <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="View" onClick={()=> this.viewDocument(data)}>View</a></li>
                                                            {/* <li><a href="javascript:void(0);" data-tip="Print" onClick={()=>this.printDocument(data)}>Print</a></li> */}
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