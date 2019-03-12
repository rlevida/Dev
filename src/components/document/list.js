import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import parallel from 'async/parallel';

import DocumentNew from "./documentNew";
import DocumentLibrary from "./documentLibrary";

import DocumentStatus from "../document/documentStatus";
import DocumentFilter from "../document/documentFilter";
import DocumentActivityLog from "../document/documentActivityLog";

import { getData } from "../../globalFunction"

import ShareModal from "../document/modal/shareModal";
import EditModal from "../document/modal/editModal";
import FolderModal from "../document/modal/folderModal";
import DeleteModal from "../document/modal/deleteModal";


import { connect } from "react-redux";

@connect((store) => {
    return {
        project: store.project,
        document: store.document,
        loggedUser: store.loggedUser
    }
})

class List extends React.Component {
    constructor(props) {
        super(props)

        this.handleActiveTab = this.handleActiveTab.bind(this)
    }

    handleActiveTab(value) {
        const { dispatch, loggedUser } = this.props;
        if (value === 'document') {
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' })
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'LibraryDocumentLoading' })

            parallel({
                new: (parallelCallback) => {
                    let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=new&starredUser=${loggedUser.data.id}`;
                    getData(requestUrl, {}, (c) => {
                        if (c.status == 200) {
                            dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                        } else {
                            showToast('success', 'Something went wrong!')
                        }
                        parallelCallback()
                    });
                },
                library: (parallelCallback) => {
                    let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=library&starredUser=${loggedUser.data.id}`;
                    getData(requestUrl, {}, (c) => {
                        if (c.status == 200) {
                            dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                        } else {
                            showToast('error', 'Something went wrong!');
                        }
                        parallelCallback()
                    });
                }
            }, () => {
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
            })
        } else if (value === 'activity') {
            getData(`/api/activityLogDocument?projectId=${project}&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`, {}, (c) => {
                dispatch({ type: 'SET_ACTIVITYLOG_DOCUMENT_LIST', list: c.data.result, count: c.data.count })
            })
        }
        dispatch({ type: 'SET_DOCUMENT_ACTIVE_TAB', active: value });
        dispatch({ type: "RESET_DOCUMENT_FILTER" });
    }

    render() {
        const { project } = this.props;

        return (
            <div class="m10">
                {/* <h3><a class="ml15" href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{project.Selected.project}</a></h3> */}
                <div class="row">
                    <div class="card">
                        <div class="col-lg-12">
                            <DocumentFilter />
                        </div>
                        <div style={{ padding: "20px" }}>
                            <div class="row">
                                {/* <DocumentStatus /> */}
                                {/* <Tabs class="mb40 mt40">
                                    <TabList>
                                        <Tab onClick={() => this.handleActiveTab('document')}>Documents</Tab>
                                        <Tab onClick={() => this.handleActiveTab('activity')}>Activity Logs</Tab>
                                    </TabList>
                                    <TabPanel> */}
                                <DocumentNew />
                                <DocumentLibrary />
                                {/* </TabPanel>
                                    <TabPanel>
                                        <DocumentActivityLog />
                                    </TabPanel>
                                </Tabs> */}

                            </div>
                        </div>
                    </div>
                    <ShareModal />
                    <EditModal />
                    <FolderModal />
                    <DeleteModal />
                </div>
            </div>
        )
    }
}

export default DragDropContext(HTML5Backend)(List)