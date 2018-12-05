import React from "react";
import parallel from 'async/parallel';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { getData, showToast } from '../../globalFunction';

import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import DocumentNew from "./documentNew";
import DocumentStatus from "./documentStatus";
import DocumentLibrary from "./documentLibrary";
import DocumentFilter from "./documentFilter";
import DocumentActivityLog from "./documentActivityLog";

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
        project: store.project,
        folder: store.folder

    }
})

class List extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { dispatch, loggedUser, document, folder } = this.props
        if (typeof document.Selected.id === "undefined" && documentId === '') {
            console.log(`here`)
            parallel({
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
                },
                members: (parallelCallback) => {
                    getData(`/api/member?linktype=project&linkId=${project}`, {}, (c) => {
                        dispatch({ type: "SET_MEMBERS_LIST", list: c.data.result, count: {} })
                        parallelCallback(null, "")
                    })
                }
            }, (error, result) => {
            })
        } else {
            let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=new&folderId=${folder.SelectedNewFolder.id}&starredUser=${loggedUser.data.id}&documentId=${documentId}`;
            console.log(requestUrl)
        }
    }
    render() {
        let { workstream, task, document, project } = this.props;
        let tagOptions = [];
        workstream.List.map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
        task.List.map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })

        return <div>
            <h3>&nbsp;&nbsp;&nbsp;&nbsp;<a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{project.Selected.project}</a></h3>
            <div class="row mb10">
                <div class="col-lg-12">
                    <DocumentFilter />
                </div>
            </div>
            <div style={{ padding: "20px" }}>
                <div class="row">
                    <DocumentStatus />
                    <Tabs class="mb40 mt40">
                        <TabList>
                            <Tab>Documents</Tab>
                            <Tab>Activity Logs</Tab>
                        </TabList>
                        <TabPanel>
                            <DocumentNew />
                            <DocumentLibrary />
                        </TabPanel>
                        <TabPanel>
                            <DocumentActivityLog />
                        </TabPanel>
                    </Tabs>

                </div>
            </div>
            <PrintModal />
            <UploadModal />
            <ShareModal />
            <EditModal />
        </div>
    }
}

export default DragDropContext(HTML5Backend)(List)