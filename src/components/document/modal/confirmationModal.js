import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData, getData } from "../../../globalFunction";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        document: store.document,
        folder: store.folder
    }
})

class ConfirmationModal extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleSubmit",
            "handleCancel"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleSubmit() {
        const { dispatch, loggedUser, match, document, folder } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            documentIds: document.SelectedFields.map((e) => { return e.id }),
            data: {
                folderId: folder.Selected.id,
                folder: folder.Selected.origin,
                projectId: projectId,
                usersId: loggedUser.data.id,
                actionType: "moved"
            }
        };
        putData(`/api/document/bulkUpdate/${folder.Selected.id}`, dataToSubmit, (c) => {
            const { result } = { ...c.data }
            dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST_BULK", list: result });
            showToast("success", "Successfully Moved.");
            if (result.length - document.List.length === 0) {
                this.fetchData(1)
            }
            this.handleCancel();
        })
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder, match } = this.props;
        const projectId = match.params.projectId;
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;
        if (ActiveTab === "trash") {
            requestUrl += `&isActive=0`;
        } else {
            requestUrl += `&isActive=1`;
            if (typeof folder.Selected.id !== "undefined") {
                requestUrl += `&folderId=${folder.Selected.id}`;
            }

            if (ActiveTab === "active" || status === "sort") {
                requestUrl += `&type=document&folderId=null`;
            }

            if (ActiveTab === "library") {
                requestUrl += `&isActive=1&isDeleted=0`;
            }

            if (ActiveTab === "archived") {
                requestUrl += `&isArchived=1`;
            } else {
                requestUrl += `&isArchived=0`;
            }
        }
        getData(requestUrl, {}, c => {
            const { count, result } = { ...c.data };
            let list = [];
            if (document.ActiveTab !== "trash" && document.ActiveTab !== "archived") {
                list = document.List.concat(result);
            } else {
                list = result;
            }
            dispatch({ type: "SET_DOCUMENT_LIST", list: list, count: count });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }

    handleCancel() {
        const { dispatch } = { ...this.props };
        $(`#confirmationModal`).modal("hide");
        dispatch({ type: "SET_DOCUMENT_SELECTED_FIELDS", Selected: [] });
        dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
        dispatch({ type: "SET_DOCUMENT_FIELDS_DRAGGING", Fields: [] });
    }

    render() {
        const { folder } = { ...this.props };
        return (
            <div class="modal fade delete-modal" id="confirmationModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Move this documents to {folder.Selected.origin}?</p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={this.handleSubmit}>
                                            Yes move this documents!
                                        </button>
                                    </div>
                                </div>
                                <div class="flex-col">
                                    <button type="button" class="btn btn-secondary" onClick={this.handleCancel}>No Don't!</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(ConfirmationModal)