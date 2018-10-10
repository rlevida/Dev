import React from "react";
import { DropDown } from "../../globalComponents";
import { showToast , postData , getData } from '../../globalFunction';
import Dropzone from 'react-dropzone';
import DocumentStatus from "./documentStatus";
import DocumentNew from "./documentNew";
import DocumentLibrary from "./documentLibrary";
import axios from "axios";
import parallel from 'async/parallel';
import PrintModal from './documentPrinterModal'
import UploadModal from './uploadModal'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        projectData : store.project

    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        let { dispatch } = this.props

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
                getData(`/api/document/getByProject`, { params: { filter: { isDeleted:0 , linkId:project , linkType:"project" }}},(c) => {
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
            // console.log(`end loading`)
        })
    }

    render() {
        let { workstream  , task , dispatch , projectData , loggedUser } = this.props;
        let tagOptions = [] ;
            workstream.List.map( e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream })})
            task.List.map( e => { tagOptions.push({ id: `task-${e.id}` , name: e.task })})

        return <div>
                <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/"+project} style={{color:"#000",textDecortion:"none"}}>{projectData.Selected.project}</a></h3>
                <div style={{paddingBottom:"50px",paddingRight:"20px"}}>
                    <div class="form-group">
                        <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal" >
                            Upload Files &nbsp; <i class="fa fa-caret-down"></i>
                        </button>
                        <input class="form-control pull-right" type="text" placeholder="Search" aria-label="Search" style={{width:"200px",marginRight:"50px"}}/>
                    </div>
                </div>
                <div style={{padding:"20px"}}>
                    <div class="row"> 
                        { 
                            (loggedUser.data.userType == "Internal") &&
                                <DocumentStatus/>
                        }
                        <DocumentNew/>
                        <DocumentLibrary/>
                    </div>
                </div>
                <PrintModal/>
                <UploadModal/>
            </div>
    }
}