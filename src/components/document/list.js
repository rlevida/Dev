import React from "react";
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import DocumentNew from "./documentNew";
import DocumentLibrary from "./documentLibrary";

import DocumentFilter from "../document/documentFilter";


import ShareModal from "../document/modal/shareModal";
import EditModal from "../document/modal/editModal";
import FolderModal from "../document/modal/folderModal";
import DeleteModal from "../document/modal/deleteModal";


import { connect } from "react-redux";

class List extends React.Component {
    render() {
        return (
            <div class="m10">
                <div class="row">
                    <div class="card">
                        <div class="col-lg-12">
                            <DocumentFilter />
                        </div>
                        <div style={{ padding: "20px" }}>
                            <div class="row">
                                <DocumentNew />
                                <DocumentLibrary />
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