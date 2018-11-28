import React from "react"
import DocumentViewerComponent from "../../document/documentViewer";
import { showToast, putData } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        workstream: store.workstream,
        task: store.task,
        global: store.global
    }
})

export default class EditModal extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div class="modal fade" id="documentViewerModal" tabIndex="-1" role="dialog" aria-labelledby="documentViewerLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                        <DocumentViewerComponent/>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}