import React from "react";
import parallel from 'async/parallel';

import { getData } from '../../globalFunction';

import DocumentNew from "./documentNew";
import DocumentStatus from "./documentStatus";
import DocumentLibrary from "./documentLibrary";

import PrintModal from "./documentPrinterModal";
import UploadModal from "./uploadModal";
import ShareModal from "./shareModal";
import EditModal from "./editModal";

import { connect } from "react-redux";
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        project: store.project

    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { dispatch, loggedUser, document } = this.props
        if (typeof document.Selected.id == "undefined") {
            parallel({
                folder: (parallelCallback) => {
                    getData(`/api/folder?projectId=${project}`, {}, (c) => {
                        if (c.status == 200) {
                            dispatch({ type: "SET_FOLDER_LIST", list: c.data })
                            parallelCallback(null, "")
                        } else {
                            parallelCallback(null, "")
                        }
                    });
                },
                task: (parallelCallback) => {
                    getData(`/api/task?projectId=${project}&userId=${loggedUser.data.id}&page=${1}&role=${loggedUser.data.userRole}`, {}, (c) => {
                        dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
                        dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                        parallelCallback(null, "")
                    });
                },
                starred: (parallelCallback) => {
                    getData(`/api/starred/`, { params: { filter: { projectId: project } } }, (c) => {
                        if (c.status == 200) {
                            dispatch({ type: "SET_STARRED_LIST", list: c.data })
                            parallelCallback(null, "")
                        } else {
                            parallelCallback(null, "")
                        }
                    });
                },
                tagList: (parallelCallback) => {
                    getData(`/api/global/selectList`, { params: { selectName: "tagList" } }, (c) => {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'tagList' })
                        parallelCallback(null, "")
                    })
                },
                shareList: (parallelCallback) => {
                    getData(`/api/globalORM/selectList?selectName=shareList&linkId=${project}&linkType=project`, {}, (c) => {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'shareList' })
                        parallelCallback(null, "")
                    })
                },
                projectMemberListGlobal: (parallelCallback) => {
                    getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project}&linkType=project`, {}, (c) => {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
                        parallelCallback(null, "")
                    })
                },
                workstreamList: (parallelCallback) => {
                    getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project}`, {}, (c) => {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
                        parallelCallback(null, "")
                    })
                },
                taskList: (parallelCallback) => {
                    getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project}`, {}, (c) => {
                        dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
                        parallelCallback(null, "")
                    })
                }
            }, (error, result) => {
                // dispatch({ type: "SET_LIBRARY_DOCUMENT_LOADING", Loading: "" })
                // dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "" })
            })
        }
    }

    render() {
        let { workstream, task, dispatch, project, loggedUser } = this.props;
        let tagOptions = [];
        workstream.List.map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
        task.List.map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })

        return <div>
            <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{project.Selected.project}</a></h3>
            <div style={{ paddingBottom: "50px", paddingRight: "20px" }}>
                <div class="form-group">
                    <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal" >
                        Upload Files &nbsp; <i class="fa fa-caret-down"></i>
                    </button>
                    <input class="form-control pull-right" type="text" placeholder="Search" aria-label="Search" style={{ width: "200px", marginRight: "50px" }} />
                </div>
            </div>
            <div style={{ padding: "20px" }}>
                <div class="row">
                    <DocumentStatus />
                    <DocumentNew />
                    <DocumentLibrary />
                </div>
            </div>
            <PrintModal />
            <UploadModal />
            <ShareModal />
            <EditModal />
        </div>
    }
}