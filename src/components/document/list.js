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
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : [] , 
            upload : false
        }
        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_DOCUMENT_LIST",{ filter : { isDeleted : 0 } });
        this.props.socket.emit("GET_STATUS_LIST",{});
        this.props.socket.emit("GET_TYPE_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_DOCUMENT_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_DOCUMENT",{data : {id:id,active:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_DOCUMENT",{id:id})
        }
    }

    archiveData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to archive this record?")){
            socket.emit("ARCHIVE_DOCUMENT",{id:id})
        }
    }
    
    saveData(){
        let { socket } = this.props
        let { tempData } = this.state
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data:tempData , loggedUser : "" })
        this.setState({ 
            upload : false , 
            tempData : []
        })
    }

    render() {
        let { document, dispatch, socket } = this.props;
        let data = [] , tempData = []
        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Document</span>
                    </li>
                </HeaderButtonContainer>

                <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal">
                    Upload Files
                </button>

                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <th>Uploaded</th>
                            <th>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                        {
                            (document.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            document.List.map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td>{data.origin}</td>
                                        <td>{ moment(data.dateAdded).format('L') }</td>
                                        <td>{data.uploadedBy}</td>
                                        <td><i class="fa fa-tag" aria-hidden="true"></i></td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="ARCHIVE"
                                                onClick={e => this.archiveData(data.id)}
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
                                    tempData.push({ Id: e.Id, filename: e.filename, origin: e.origin })
                                })
                                this.setState({ tempData : tempData })
                            },
                            chooseFile: (resp) => {
                                this.setState({ upload : true })
                            }
                        }}>
                            <a class="btn btn-primary" ref="chooseBtn" style={{ marginRight: "2px" }} >choose</a>
                            { ( this.state.upload ) && 
                                <a ref="uploadBtn" class="btn btn-primary">upload</a>
                            }
                        </FileUpload>
                        <table id="dataTable" class="table responsive-table">
                            <tbody>
                            {(this.state.tempData.length > 0) &&
                                this.state.tempData.map((data, index) => {
                                    return  (
                                        <tr key={index}>
                                            <td><span><i class="fa fa-file" aria-hidden="true"></i></span></td>
                                            <td>{data.origin}</td>
                                            <td><span><i class="fa fa-tag" aria-hidden="true"></i></span></td>
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