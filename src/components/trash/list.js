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
        users : store.users,
        starred : store.starred,
        global : store.global,
        workstream : store.workstream
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : []
        }
        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        let { socket } = this.props
            socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted: 1 , linkId: project , linkType: "project" }});
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" , filter : { tagType : "document" } })
            socket.emit("GET_WORKSTREAM_LIST", {filter:{projectId:project}});
            socket.emit("GET_STATUS_LIST",{});
            socket.emit("GET_TYPE_LIST",{});
            socket.emit("GET_USER_LIST",{});
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

    saveData(){
        let { socket } = this.props
        let { tempData } = this.state
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data:tempData , loggedUser : "" })
    }

    handleIsCompleted(data,value){
        let { socket , document } = this.props;
            socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data : { id: data.id , isCompleted : value ? 0 : 1  }})
    }

    deleteDocument(id){
        let{ socket } = this.props;
            if(confirm("Do you really want to delete this record?")){
                socket.emit("DELETE_TRASH_DOCUMENT",{id:id})
            }
    }

    render() {
        let { document, dispatch, users , starred , global , workstream } = this.props;
        let tagList = [];

            if(typeof global.SelectList.tagList != "undefined"){
                global.SelectList.tagList.map( t => {
                    if(workstream.List.filter( w => { return w.id == t.linkId}).length > 0 ){
                    let workstreamName =  workstream.List.filter( w => { return w.id == t.linkId})[0].workstream
                    tagList.push({ tagTypeId :t.tagTypeId  , name : workstreamName , linkId : t.linkId })
                    }
                })
            }

        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Document</span>
                    </li>
                </HeaderButtonContainer>
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
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            document.List.map((data, index) => {
                                return <tr key={index}>
                                        <td> <input type="checkbox"/></td>
                                        <td>{
                                            starred.List.filter( s => { return s.linkId == data.id }).length > 0 
                                                ? <span class="glyphicon glyphicon-star"></span>
                                                    : <span class="glyphicon glyphicon-star-empty"></span> 
                                            }
                                        </td>
                                        <td>{data.origin}</td>
                                        <td>{ moment(data.dateAdded).format('L') }</td>
                                        <td>{ (users.List .length > 0) ? users.List.filter( f => { return f.id == data.uploadedBy })[0].emailAddress : ""}</td>
                                        <td>{ (tagList.length > 0) &&
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
                                                    <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
    }
}