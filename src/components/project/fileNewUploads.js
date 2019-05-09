import React from "react";
import { connect } from "react-redux";
import DocumentList from "../document/documentList"

@connect((store) => {
    return {
        document: store.document
    }
})
export default class FileNewUploads extends React.Component {
    constructor(props) {
        super(props)

        _.map([
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }


    render() {
        const { dispatch } = { ...this.props }
        return (
            <div class="modal fade" id="file-new-upload" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <a class="text-grey" data-dismiss="modal" aria-label="Close" onClick={() => {
                                dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: {} });
                                dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
                            }}>
                                <span>
                                    <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                    <strong>Back</strong>
                                </span>
                            </a>
                        </div>
                        <div class="modal-body">
                            <DocumentList pageModal={"project"}></DocumentList>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}