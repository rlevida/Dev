import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData, getData } from "../../../globalFunction";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        document: store.document,
        project: store.project
    }
})
class DeleteModal extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "deleteDocument",
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    fetchData() {
        const { dispatch, loggedUser, match, document } = { ...this.props };
        const projectId = match.params.projectId;
        let requestUrl = `/api/document?isActive=0&isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });

        getData(`${requestUrl}`, {}, (c) => {
            const { result, count } = { ...c.data };
            let list = [];
            if (document.ActiveTab === "trash") {
                list = result;
            } else {
                list = document.List.concat(result)
            }
            dispatch({ type: "SET_DOCUMENT_LIST", list: list, count: count });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' });

        });
    }

    deleteDocument() {
        const { document, dispatch, loggedUser, match } = { ...this.props };
        const { current_page, last_page } = { ...document.Count };
        const projectId = match.params.projectId;
        if (document.ActiveTab !== "trash") {
            putData(`/api/document/${document.Selected.id}`, {
                isActive: 0, usersId: loggedUser.data.id,
                oldDocument: document.Selected.origin,
                projectId: projectId, type: document.Selected.type,
                actionType: "deleted", title: `deleted a ${document.Selected.type}`
            }, (c) => {
                if (c.status == 200) {
                    if (last_page > current_page && document.List.length < 10) {
                        this.fetchData();
                    } else {
                        dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: document.Selected });
                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                    }
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
                $(`#deleteModal`).modal("hide");
            })
        } else if (document.ActiveTab === "trash") {
            const documentIds = document.List.map((e) => { return e.id });
            putData(`/api/document/empty/${document.Selected.id}`, {
                documentIds: documentIds, data: { isDeleted: 1 }
            }, (c) => {
                if (c.status == 200) {
                    this.fetchData();
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
                $(`#deleteModal`).modal("hide");
            })
        }
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
                            {document.ActiveTab !== "trash" ?
                                <span>
                                    <p class="warning text-center">Delete this {Selected.type}?</p>
                                    <p class="warning text-center"><strong>{Selected.origin}</strong></p>
                                </span>
                                :
                                <span>
                                    <p class="warning text-center">Empty all items from Trash?</p>
                                </span>
                            }
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

export default withRouter(DeleteModal)