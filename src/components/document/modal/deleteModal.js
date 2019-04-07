import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData } from "../../../globalFunction";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        document: store.document
    }
})
class ArchiveModal extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "deleteDocument",
            "archiveProject"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    deleteDocument() {
        const { document, dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        putData(`/api/document/${document.Selected.id}`, {
            isDeleted: 1, usersId: loggedUser.data.id,
            oldDocument: document.Selected.origin,
            projectId: projectId, type: document.Selected.type,
            actionType: "deleted", title: 'Document deleted'
        }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", Id: document.Selected.id });
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                showToast("success", "Successfully Deleted.");
            } else {
                showToast("error", "Delete failed. Please try again later.");
            }
            $(`#deleteModal`).modal("hide");
        })
    }

    archiveProject() {
        const { dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = { isDeleted: 1 }

        putData(`/api/project/archive/${projectId}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DELETED_PROJECT_LIST", id: c.data });
                showToast("success", "Successfully Archived.");
            }
            $(`#archiveModal`).modal("hide");
        })
    }

    render() {
        const { document } = { ...this.props };
        const { Selected } = document;

        return (
            <div class="modal fade delete-modal" id="deleteModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Delete this {Selected.type}?</p>
                            <p class="warning text-center"><strong>{Selected.origin}</strong></p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={this.deleteDocument}>
                                            Yes delete {Selected.type}!
                                        </button>
                                    </div>
                                </div>
                                <div class="flex-col">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">No Don't!</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(ArchiveModal)