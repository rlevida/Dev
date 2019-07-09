import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { withRouter } from "react-router";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        document: store.document,
        folder: store.folder
    };
})
class ConfirmationModal extends React.Component {
    constructor(props) {
        super(props);

        _.map(["handleSubmit", "handleCancel"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleSubmit() {}

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
            <div class="modal fade" id="confirmationModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true" />
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
                                    <button type="button" class="btn btn-secondary" onClick={this.handleCancel}>
                                        No Don't!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ConfirmationModal);
