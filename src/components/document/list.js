import React from "react";
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import DocumentActionTab from "../document/documentActionTab";
import ShareModal from "../document/modal/shareModal";
import EditModal from "../document/modal/editModal";
import FolderModal from "../document/modal/folderModal";
import DeleteModal from "../document/modal/deleteModal";
import ArchiveModal from "../document/modal/archiveModal";
import DocumentList from "../document/documentList";
import DocumentFilter from "../document/documentFilter";
import _ from "lodash";
import { connect } from "react-redux";

@connect((store) => {
    return {
        document: store.document,
    }
})

class List extends React.Component {
    render() {
        const { document } = { ...this.props }
        return (
            <div>
                <div class="row">
                    <div class="col-lg-12">
                        {(document.ActiveTab === "active" || document.ActiveTab === "library") &&
                            < div class="card mb20">
                                <DocumentFilter />
                            </div>
                        }
                        <div class="card">
                            <div class="mb20 bb">
                                <DocumentActionTab />
                            </div>
                            <DocumentList />
                        </div>
                    </div>
                </div>
                <ShareModal />
                <EditModal />
                <FolderModal />
                <DeleteModal />
                <ArchiveModal />
            </div >
        )
    }
}

export default DragDropContext(HTML5Backend)(List)