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
                filter : { isDeleted : 0 , linkId : workstream.Selected.id , linkType : "workstream", tagType: "document" }
            });

            socket.emit("GET_USER_LIST",{});
            socket.emit("GET_SETTINGS", {});
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "documentList"})
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "workstreamList"})
            socket.emit("GET_STARRED_LIST",{filter : { linkType : "project" } })
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
                filter : { tagTypeId : document.Selected.id , linkType : "workstream", tagType: "document"  },
                linkId : workstream.Selected.id,
                type : "workstream"
            })
    }

    selectTag(e , index){
        let { tempData }  = this.state;
            tempData[index].tags = JSON.stringify(e);
            tempData[index].status = "library";
            this.setState({ tempData : tempData });
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

    editDocument(data , type){
        let { dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_SELECTED" , Selected: data });
            dispatch({type:"SET_DOCUMENT_EDIT_TYPE" , EditType: type })
            $("#workstreamDocumentModal").modal("show")
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

    render() {
        let { document, dispatch, workstream , users , loggedUser , settings , starred , global:{ SelectList }} = this.props;
        let data = [] , tempData = [] , workstreamList = [];
        if( typeof SelectList.workstreamList != "undefined"){
            workstreamList = SelectList.workstreamList.map( e =>{ return { id:e.id , name:e.workstream } })
        }
        return <div>
                <div class="row"> 
                    <br/>
                    <div class="col-lg-12 col-md-12">  
                        <h3>Documents linked to this workstream</h3>
                        <table id="dataTable" class="table responsive-table table-bordered document-table">
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Uploaded</th>
                                    <th>By</th>
                                    <th>Tags</th>
                                    <th></th>
                                </tr>

                                {
                                    (document.List.length == 0) &&
                                    <tr><td colSpan={8}>No Record Found!</td></tr>
                                }

                                {
                                    document.List.map((data, index) => {
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
                                                <td> 
                                                    { ( data.tags != "" && data.tags != null ) &&
                                                        JSON.parse(data.tags).map((tag,tagIndex) =>{
                                                            return <span key={tagIndex} class="label label-primary" style={{margin:"5px"}}>{tag.label}</span>
                                                        })
                                                    }
                                                </td>
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
                            { (document.EditType == "tags" && workstreamList.length > 0) && 
                                <div class="form-group" style={{marginBottom:"30px"}}>
                                    <label class="col-md-3 col-xs-12 control-label">Document Tags *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown 
                                            name="tags"
                                            multiple={true}
                                            required={false}
                                            options={ workstreamList } 
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