import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";
import moment from 'moment'
import FileUpload from 'react-fileupload';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users : store.users,
        settings: store.settings,
        starred : store.starred

    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : [] , 
            upload : false,
            loading : false,
            tags : []
        }
        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        let { socket } = this.props
            socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted : 0 , linkId : project , linktype : "project" }});
            socket.emit("GET_USER_LIST",{});
            socket.emit("GET_SETTINGS", {});
            socket.emit("GET_WORKSTREAM_LIST", {filter:{projectId:project}});
            socket.emit("GET_STARRED_LIST",{ filter : { linkType : "project" } })
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
            dispatch({type:"SET_DOCUMENT_STATUS",record:{id:id,status:(active==1)?0:1}});
            socket.emit("SAVE_OR_UPDATE_DOCUMENT",{data : {id:id,active:(active==1)?0:1}});
    }

    deleteData(id){
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
    
    saveData(){
        let { socket , loggedUser } = this.props;
        let { tempData , tags } = this.state;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data: tempData , userId : loggedUser.data.id, project: project, tags: JSON.stringify(tags) });
            this.setState({  upload : false ,   tempData : [] , tags : [] });
    }

    selectTag(e , index){
        let { tempData }  = this.state;
            tempData[index].tags = JSON.stringify(e);
            tempData[index].status = "foraction";
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

    editDocument(data){
        let { dispatch } = this.props;
        dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({type:"SET_DOCUMENT_SELECTED" , Selected : data });
    }

    render() {
        let { document, dispatch, workstream , users , loggedUser , settings , starred } = this.props;
        let data = [] , tempData = [];
        let workstreamList = workstream.List.map( e => { return { id:e.id , name:e.workstream }})
        let documentList = { newUpload : [] , forAction : [] };

            if( document.List.length > 0 ){
                document.List.filter( e =>{
                    if( e.status == "newupload" && e.isCompleted != 1 ){
                        documentList.newUpload.push(e)
                    }
                    if( e.status == "foraction" && e.isCompleted != 1 ){
                        documentList.forAction.push(e)
                    }
                })
            }
        
        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Document</span>
                    </li>
                </HeaderButtonContainer>
                <div class="form-group">
                    <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal">
                        Upload Files
                    </button>
                </div>
                <div class="tool-bar">
                    <span class="label label-success" style={{fontSize:"12px"}}> New Uploads { documentList.newUpload.length }</span> 
                    <span class="label label-primary" style={{fontSize:"12px"}}> For Action { documentList.forAction.length }</span>
                </div>

                <h3>New Documents</h3>
                <table id="dataTable" class="table responsive-table table-bordered">
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
                            (documentList.newUpload.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }

                        {
                            documentList.newUpload.map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td> <input type="checkbox" onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }/></td>
                                        <td style={{textAlign:"center"}}> 
                                            {
                                                starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                    ? <span class="glyphicon glyphicon-star" onClick={()=> this.starDocument( data , 1 )} style={{ cursor:"pointer" }}></span>
                                                        : <span class="glyphicon glyphicon-star-empty"  onClick={()=> this.starDocument( data , 0 )} style={{ cursor:"pointer" }}></span> 
                                            }
                                        </td>
                                        <td> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }>{ data.origin }</a></td>
                                        <td>{ moment(data.dateAdded).format('L') }</td>
                                        <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                        <td> 
                                            { ( data.tags != "" && data.tags != null ) &&
                                                JSON.parse(data.tags).map((tag,tagIndex) =>{
                                                    return <span key={tagIndex} class="label label-primary" style={{margin:"5px"}}>{tag.label}</span>
                                                })
                                            }
                                        </td>
                                        <td class="text-center">
                                        <div class="dropdown">
                                            <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                               Action
                                            </button>
                                            <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                <li><a href="javascript:void(0)" onClick={()=> this.viewDocument(data)}>View</a></li>
                                                <li><a href="javascript:void(0)" onClick={()=> this.editDocument(data)}>Edit</a></li>
                                                <li>
                                                    <a href={ settings.imageUrl + "/upload/" + data.name } data-tip="Delete"> Download </a>
                                                </li>
                                                <li>
                                                {
                                                    starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                        ? <a href="javascript:void(0)" onClick={()=> this.starDocument( data , 1)}>Unstarred</a>
                                                            :  <a href="javascript:void(0)" onClick={()=> this.starDocument( data , 0 )}>Star</a>
                                                }
                                                </li>
                                                <li>
                                                    <a href="javascript:void(0);" data-tip="Delete"
                                                        onClick={e => this.deleteData(data.id)}
                                                       > Delete
                                                    </a>
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

                <hr/>

                <h3>Library</h3>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th></th>
                            <th>Name</th>
                            <th>Uploaded</th>
                            <th>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                        {
                            (documentList.forAction.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }

                        {
                            documentList.forAction.map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td> <input type="checkbox" onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }/></td>
                                        <td> <a href="javascript:void(0)" onClick={()=> this.viewDocument(data) }>{data.origin}</a></td>
                                        <td>{ moment(data.dateAdded).format('L') }</td>
                                        <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                        <td> 
                                            { ( data.tags != "" && data.tags != null ) &&
                                                JSON.parse(data.tags).map((tag,tagIndex) =>{
                                                    return <span key={tagIndex} class="label label-primary" style={{margin:"5px"}}>{tag.label}</span>
                                                })
                                            }
                                        </td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="ARCHIVE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={ data.allowedDelete==0 ? 'hide' : 'btn btn-danger btn-sm ml10' }>
                                                <span class="glyphicon glyphicon-trash"></span>
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>

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
                            <FileUpload required options={{
                                baseUrl: '/api/upload',
                                param: {
                                    category: '1',
                                    name: "document",
                                    type: "upload",
                                    uploadType: "form"
                                },
                                dataType: 'json',
                                multiple: true,
                                uploadSuccess: (resp) => {
                                    resp.files.map((e) => {
                                        tempData.push({ name: e.filename, origin: e.origin , project: project ,uploadedBy : loggedUser.data.id , status : "newupload"})
                                    })
                                    this.setState({ tempData : tempData , loading : false  })
                                },
                                chooseFile: (resp) => {
                                    this.setState({ upload : true })
                                }
                            }}>
                                    <a class="btn btn-primary" ref="chooseBtn" style={ this.state.loading ? { display:"none" } : { marginRight: "2px" }} >choose</a>
                                    { ( this.state.upload  && !this.state.loading ) && 
                                        <a ref="uploadBtn" class="btn btn-primary" onClick={()=> this.setState({ loading : true })}>upload</a>
                                    }
                            </FileUpload>
                            <table id="dataTable" class="table responsive-table">
                                <tbody>
                                {( this.state.tempData.length == 0 && this.state.loading ) &&
                                    <tr>
                                        <td style={{textAlign:"center"}} colSpan={8}><i class="fa fa-spinner fa-spin" style={{ fontSize:"36px" , marginTop: "50px"}}></i></td>
                                    </tr>
                                }
                                {(this.state.tempData.length > 0) &&
                                    this.state.tempData.map((data, index) => {
                                        return  (
                                            <tr key={index}>
                                                <td><span class="glyphicon glyphicon-star-empty"></span></td>
                                                <td><span><i class="fa fa-file" aria-hidden="true"></i></span></td>
                                                <td>{data.origin}</td>
                                                <td><span><i class="fa fa-tag" aria-hidden="true"></i></span></td>
                                                <td>   
                                                    <DropDown multiple={false} 
                                                        multiple={true}
                                                        required={false}
                                                        options={ workstreamList } 
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
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={ () => this.saveData() }>Save</button>
                            }
                        </div>
                        </div>
                    </div>
                </div>
            </div>
    }
}