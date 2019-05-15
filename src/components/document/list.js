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
import _ from "lodash";

class List extends React.Component {
    render() {
        return (

            <div>
                <div class="row">
                    <div class="col-lg-12">
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
            </div>
        )
    }
}

export default DragDropContext(HTML5Backend)(List)