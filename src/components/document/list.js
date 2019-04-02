import React from "react";
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DocumentFilter from "../document/documentFilter";
import ShareModal from "../document/modal/shareModal";
import EditModal from "../document/modal/editModal";
import FolderModal from "../document/modal/folderModal";
import DeleteModal from "../document/modal/deleteModal";
import DocumentList from "../document/documentList";
import DocumentViewerModal from "./modal/documentViewerModal"
import _ from "lodash";

import { connect } from "react-redux";

@connect((store) => {
    return {
        document: store.document,
    }
})

class List extends React.Component {
    render() {
        const { document } = { ...this.props };
        const { Count } = { ...document }
        return (

            <div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card mb20 ">
                            <div class="card-header bb">
                                <DocumentFilter />
                            </div>
                            <div class={_.isEmpty(Count) ? "linear-background" : ""}>
                                <div style={document.Filter.status !== "sort" ? { padding: "20px" } : { paddingLeft: '20px', paddingRight: '20x' }}>
                                    <div class="row">
                                        <DocumentList />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ShareModal />
                <EditModal />
                <FolderModal />
                <DeleteModal />
                <DocumentViewerModal />
            </div>
        )
    }
}

export default DragDropContext(HTML5Backend)(List)