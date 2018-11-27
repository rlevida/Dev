import React from "react";
import parallel from 'async/parallel';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { getData, showToast } from '../../globalFunction';

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

let delayTimer;

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
        this.handleOnChange = this.handleOnChange.bind(this)
    }

    componentDidMount() {
        let { dispatch, loggedUser, document } = this.props
        if (typeof document.Selected.id == "undefined") {
            parallel({
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

    handleOnChange(e) {
        const { dispatch, loggedUser, document } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILTER', filter: { ...document.filter, [e.target.name]: e.target.value } })
        clearTimeout(delayTimer);
        const filter = { ...document.Filter, [e.target.name]: e.target.value }
        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' })
        delayTimer = setTimeout(function () {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&search=${filter.search}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    showToast('success', 'Documents successfully retrieved.')
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        }, 1000);
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