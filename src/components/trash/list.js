import React from "react";
import parallel from 'async/parallel';

import { getData } from '../../globalFunction';
import { HeaderButtonContainer} from "../../globalComponents";
import moment from 'moment'

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
        let { dispatch } = this.props;
        parallel({
            folder : (parallelCallback) => {   
                getData(`/api/folder/`, { params:{ filter: { projectId: project }}},(c) => {
                    if(c.status == 200){
                        dispatch({ type: "SET_FOLDER_LIST", list: c.data })
                        parallelCallback(null,"")
                    }else{
                        parallelCallback(null,"")
                    }
                });
            },
            task : (parallelCallback) => {
                getData(`/api/task/`,{ params: { filter: { projectId: project }}},(c) => {
                    if(c.status == 200){
                        dispatch({ type: "SET_TASK_LIST", list: c.data })
                        parallelCallback(null,"")
                    }else{
                        parallelCallback(null,"")
                    }
                });
            },
            starred : (parallelCallback) => {
                getData(`/api/starred/`,{ params: { filter: { projectId: project }}},(c) => { 
                    if(c.status == 200){
                        dispatch({ type: "SET_STARRED_LIST", list: c.data })
                        parallelCallback(null,"")
                    }else{
                        parallelCallback(null,"")
                    }
                });
            },
            workstream : (parallelCallback) => {
                getData(`/api/workstream/`, { params: { filter: { projectId: project }}},(c) => {
                    if(c.status == 200){
                        dispatch({ type: "SET_WORKSTREAM_LIST", list: c.data })
                        parallelCallback(null,"")
                    }else{
                        parallelCallback(null,"")
                    }
                });
            },
            document : (parallelCallback) => {
                getData(`/api/document/`, { params: { filter: { documentFilter: { isDeleted: 1 }, documentLinkFilter: { linkId: project, linkType: "project" } }}},(c) => {
                    if(c.status == 200){
                        dispatch({ type:"SET_DOCUMENT_LIST",list : c.data})
                        parallelCallback(null,"")
                    }else{
                        parallelCallback(null,"")
                    }
                });
            },
            tagList : (parallelCallback) => {
                getData(`/api/global/selectList`,{ params: { selectName: "tagList" }},(c) => {
                    dispatch({type:"SET_APPLICATION_SELECT_LIST",List: c.data , name: 'tagList' })
                    parallelCallback(null,"")
                })
            },
            shareList : (parallelCallback) => {
                 getData(`/api/global/selectList`,{ params: { selectName: "shareList" , filter: { linkType: "project" , linkId : project }}},(c) => {
                    dispatch({type:"SET_APPLICATION_SELECT_LIST",List: c.data , name: 'shareList' })
                    parallelCallback(null,"")
                })
            },
            ProjectMemberList : (parallelCallback) => {
                getData(`/api/global/selectList`,{ params: { selectName: "ProjectMemberList" , filter: { linkType: "project" , linkId : project }}},(c) => {
                    dispatch({type:"SET_APPLICATION_SELECT_LIST",List: c.data , name: 'ProjectMemberList' })
                    parallelCallback(null,"")
                })
            }
        } ,(error, result) => {
            dispatch({type:"SET_DOCUMENT_LOADING", Loading: false })
        })
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