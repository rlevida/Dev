import React from "react"
import { connect } from "react-redux"

import DocumentViewerComponent from "../../../document/documentViewer";

@connect((store) => {
    return {
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