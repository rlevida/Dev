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
        folder : store.folder

    }
})
export default class WorkstreamDocumentViewer extends React.Component {
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
        this.handleChange =  this.handleChange.bind(this)
    }

    componentWillMount() {
        let { socket , workstream } = this.props
            socket.emit("GET_DOCUMENT_LIST", { 
                filter : { isDeleted : 0 } , type : "workstream"
            });
            // let taskListInterval = setInterval(()=>{
            //     if(this.props.workstream.Selected.id){
            //         this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: this.props.workstream.Selected.id  } });
            //         clearInterval(taskListInterval)
            //     }
            // },1000)

            socket.emit("GET_USER_LIST",{});
            socket.emit("GET_SETTINGS", {});
            socket.emit("GET_FOLDER_LIST",{filter:{projectId: project }})
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "documentList"})
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "workstreamList"})
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" , filter : { tagType : "document" } })
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
        let { socket , loggedUser , document , workstream } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { 
                data : document.Selected ,  
                filter : { tagTypeId : document.Selected.id , tagType: "document" },
                type: "workstream",
                linkId : workstream.Selected.id,
                linkType : "workstream",
                tagType : "document"
            })
    }

    viewDocument(data){
        let { socket, dispatch } = this.props;
            dispatch({type:"SET_WORKSTREAM_FORM_ACTIVE", FormActive: "WorkstreamDocumentViewer" });
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
        let newData = { ... data } , tempTags = [];
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
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type });
            $("#workstreamDocumentModal").modal("show");

    }

    handleChange(e) {
        let { socket, dispatch, document } = this.props
        let Selected = Object.assign({},document.Selected)
            Selected[e.target.name] = e.target.value;
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected:Selected})
    }

    selectTag(e,data){
        let { dispatch , document } = this.props;
        let Selected = Object.assign({},document.Selected);
            Selected["tags"] = JSON.stringify(e)
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected:Selected})
    }

    goToFolder(data){
        let { dispatch , folder } = this.props;
        if(data.id != null){
            let documentFolder = folder.List.filter( e =>{
                return e.id == data.folderId
            })
            let folderParams = ""
            if(data.folderId){
                folderParams = `?folder=${data.folderId}&type=${data.status}`
            }
            window.location.replace(`/project/documents/${project}`+folderParams);
        }
    }

    render() {
        let { document, dispatch, workstream , users , settings , starred , global , task , folder} = this.props;
        let tagList = [] , tagOptions = [] ,  documentList = [];

            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

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

            if(typeof global.SelectList.tagList != "undefined"){
                let tempTagList = [];
                    global.SelectList.tagList.map( tag => {
                        if(tag.linkType == "workstream" && tag.linkId == workstream.Selected.id){
                                tempTagList.push(tag)
                        }

                        if(tag.linkType == "task"){
                            task.List.map( t =>{
                                if(t.id == tag.linkId && t.workstreamId == workstream.Selected.id){
                                    tempTagList.push(tag)
                                }
                            })
                        }
                    })
                if(tempTagList.length){
                    tempTagList.map( temp =>{
                        document.List.map(e => { if( e.id == temp.tagTypeId){ documentList.push(e) } })
                    })
                }
            }
        return <div>
                <div class="row"> 
                    <br/>
                    <div class="col-lg-12 col-md-12">  
                        <h3 class="m0">Documents</h3>

                        {(typeof folder.Selected.id == "undefined") &&
                            <table id="dataTable" class="table responsive-table document-table mt30">
                                <tbody>
                                    <tr>
                                        <th></th>
                                        <th></th>
                                        <th>Name</th>
                                        <th>Uploaded date</th>
                                        <th>Uploaded by</th>
                                        <th>Tags</th>
                                        <th></th>
                                    </tr>

                                    {
                                        (documentList.length == 0) &&
                                        <tr><td colSpan={8}>No Record Found!</td></tr>
                                    }

                                    {  (documentList.length > 0) &&
                                        documentList.map((data, index) => {
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
                                                    <td class="library-document"> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }><span class="glyphicon glyphicon-file"></span>{ data.origin }</a></td>
                                                    <td>{ moment(data.dateAdded).format('L') }</td>
                                                    <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
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
                                                                <li><a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Download">Download</a></li>
                                                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "rename" , tagList )}>Rename</a></li>
                                                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.editDocument( data , "tags" , tagList )}>Edit Tags</a></li>
                                                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={()=> this.goToFolder( data )}>Go to folder</a></li>
                                                                <li>{ starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                                        ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                                            :  <a href="javascript:void(0)" data-tip="Star" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                                    }
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        }
                        {(typeof folder.Selected.id != "undefined") &&
                            <table id="dataTable" class="table responsive-table document-table mt30">
                                <tbody>
                                <tr>
                                    <td><input type="checkbox"/></td>
                                    <td><span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( folder.Selected , 0 )} style={{ cursor:"pointer" }}></span></td>
                                    <td><a href="javascript:void(0)" onClick={()=> dispatch({type:"SET_FOLDER_SELECTED" , Selected : {} })}><span class="fa fa-folder" style={{marginRight:"20px"}}></span>{folder.Selected.name}</a></td>
                                    <td>{moment(folder.Selected.dateUpdated).format('L')}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                                </tbody>
                            </table>
                        }
                    </div>
                </div>
                <div class="modal fade" id="workstreamDocumentModal" tabIndex="-1" role="dialog" aria-labelledby="workstreamDocumentModal" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="workstreamDocumentModal">Edit</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            { (document.EditType == "rename") && 
                                    <div class="form-group" style={{marginBottom:"30px"}}>
                                        <label class="col-md-3 col-xs-12 control-label">Document Name *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="origin" required value={(typeof document.Selected.origin == "undefined")?"":document.Selected.origin} class="form-control" placeholder="Document" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                            }
                            { (document.EditType == "tags" && tagOptions.length > 0) && 
                                <div class="form-group" style={{marginBottom:"30px"}}>
                                    <label class="col-md-3 col-xs-12 control-label">Document Tags *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown 
                                            name="tags"
                                            multiple={true}
                                            required={false}
                                            options={ tagOptions } 
                                            selected={ ( document.Selected.tags != null ) ? JSON.parse(document.Selected.tags) : []  } 
                                            onChange={(e)=>this.selectTag(e , document.Selected )} 
                                            /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            }
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={ () => this.saveDocument() }>Save</button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
    }
}