import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";
import moment from 'moment'
import FileUpload from 'react-fileupload';
import Dropzone from 'react-dropzone';
import DocumentStatus from "./documentStatus"

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
        task : store.task

    }
})
export default class List extends React.Component {
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
        this.onDrop = this.onDrop.bind(this)
    }

    componentWillMount() {
        let { socket } = this.props
            socket.emit("GET_USER_LIST",{});
            socket.emit("GET_SETTINGS", {});
            socket.emit("GET_TASK_LIST", { filter: { projectId: project }});
            socket.emit("GET_STARRED_LIST",{ filter : { linkType : "project" } })
            socket.emit("GET_WORKSTREAM_LIST", { filter : { projectId : project } });
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" , filter : { tagType : "document" } })
            socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted : 0 , linkId : project , linkType : "project" }});

            
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

    selectTag(e , index){
        let { tempData }  = this.state;
            tempData[index].tags = JSON.stringify(e);
            tempData[index].status = "library";
            this.setState({ tempData : tempData });
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

    onDrop(files){
        this.setState({ files  , upload : true });
    }

    uploadFile(){
        let { loggedUser } = this.props,
            { files } = this.state
        let data = new FormData() , tempData = [] , self = this

            this.setState({ loading : true })

            files.map( e =>{
                data.append("file",e)
            } )

            $.ajax({
                url: '/api/upload?uploadType=form&type=upload',
                type: 'post',
                dataType: 'json',
                data: data,
                processData: false,
                contentType: false,
                success: function(res) {   
                    res.files.map( e =>{
                        tempData.push({ name: e.filename, origin: e.origin , project: project ,uploadedBy : loggedUser.data.id , status : "new" })
                    })
                    self.setState({ tempData : tempData , loading : false , upload : false })
                }
            });
    }

    moveToLibrary(data){
        let { socket } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT" , { data : { status : "library" , id : data.id }})
    }

    render() {
        let { document, dispatch, workstream , users , settings , starred , global , task } = this.props;
        let documentList = { newUpload : [] , library : [] } , tagList = [] , tagOptions = [] ;

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

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

        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Document</span>
                    </li>
                </HeaderButtonContainer>
                <div class="row">
                    <div class="col-lg-12 col-md-12">
                        <div class="form-group">
                            <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal">
                                Upload Files &nbsp; <i class="glyphicon glyphicon-upload"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="row"> 
                    <br/>
                    <div class="col-lg-12 col-md-12">  
                        
                        <DocumentStatus/>

                        <h3>New Documents</h3>
                        <table id="dataTable" class="table responsive-table table-bordered document-table">
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Uploaded</th>
                                    <th>By</th>
                                    {/* <th>Tags</th> */}
                                    <th></th>
                                </tr>

                                {
                                    (documentList.newUpload.length == 0) &&
                                    <tr><td colSpan={8}>No Record Found!</td></tr>
                                }

                                {
                                    documentList.newUpload.map((data, index) => {
                                        return (
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
                                                <td> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                                                <td>{ moment(data.dateAdded).format('L') }</td>
                                                <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                                {/* <td> 
                                                    { ( data.tags != "" && data.tags != null ) &&
                                                        JSON.parse(data.tags).map((tag,tagIndex) =>{
                                                            return <span key={tagIndex} class="label label-primary" style={{margin:"5px"}}>{tag.label}</span>
                                                        })
                                                    }
                                                </td> */}
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "rename" )}>Rename</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" )}>Edit Tags</a></li>
                                                            <li>{ starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                                    ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                                        :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                                }
                                                            </li>
                                                            <li><a href="javascript:void(0)" data-tip="Move to library" onClick={()=> this.moveToLibrary(data)}>Move to library</a></li>
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

                    <hr/>
                    <div class="col-lg-12 col-md-12">
                        <h3>Library</h3>
                        <table id="dataTable" class="table responsive-table table-bordered document-table" ref={el => (this.componentRef = el)}>
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Modified</th>
                                    <th>Members</th>
                                    <th>Tags</th>
                                    <th></th>
                                </tr>
                                {
                                    (documentList.library.length == 0) &&
                                    <tr>
                                        <td colSpan={8}>No Record Found!</td>
                                    </tr>
                                }

                                {
                                    documentList.library.map((data, index) => {
                                        return (
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
                                                <td></td>
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

                <div class="modal fade" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="uploadFileModalLabel">Upload File</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">

                            { (!this.state.loading) &&
                                <Dropzone onDrop={this.onDrop.bind(this)}
                                    class="document-file-upload"
                                >
                                    <div style={{ textAlign : "center" , height: "100%" , padding: "60px"}}>
                                        <div>
                                        { ( this.state.upload  && !this.state.loading ) ?
                                            <span style={{ fontSize: "75px" }} class="glyphicon glyphicon-file"></span> : 
                                            <p>Drop some files here, or click to select files to upload.</p>
                                        }
                                        </div>
                                    </div>
                                </Dropzone>
                            }

                            <br/>

                            { ( this.state.upload  && !this.state.loading ) && 
                                <div class="form-group text-center">
                                    <button class="btn btn-success" onClick={()=> this.uploadFile()}> Upload</button>
                                </div>
                            }

                            <table id="dataTable" class="table responsive-table">
                                <tbody>
                                {( this.state.tempData.length == 0 && this.state.loading ) &&
                                    <tr>
                                        <td colSpan={8}><i class="fa fa-spinner fa-spin" style={{ fontSize:"36px" , marginTop: "50px"}}></i></td>
                                    </tr>
                                }
                                {(this.state.tempData.length > 0) &&
                                    this.state.tempData.map((data, index) => {
                                        return  (
                                            <tr key={index}>
                                                <td><span><i class="fa fa-file" aria-hidden="true"></i></span></td>
                                                <td>{data.origin}</td>
                                                <td><span><i class="fa fa-tag" aria-hidden="true"></i></span></td>
                                                <td>   
                                                    <DropDown multiple={false} 
                                                        multiple={true}
                                                        required={false}
                                                        options={ tagOptions } 
                                                        selected={ ( typeof data.tags != "undefined" ) ? JSON.parse(data.tags) : []  } 
                                                        onChange={(e)=>this.selectTag(e , index)} 
                                                        /> 
                                                    <div class="help-block with-errors"></div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                                </tbody>
                            </table>

                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            { ( this.state.tempData.length > 0) && 
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={ () => this.saveDocument() }>Save</button>
                            }
                        </div>
                        </div>
                    </div>
                </div>
            </div>
    }
}