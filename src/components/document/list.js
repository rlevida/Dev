import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

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
        project: store.project,
    }
})

class List extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { project } = this.props;

        return (
            <div class="m10">
                <h3><a class="ml15" href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{project.Selected.project}</a></h3>
                <div class="row">
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
        )
    }
}

export default DragDropContext(HTML5Backend)(List)