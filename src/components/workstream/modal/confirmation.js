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

    handleSubmit() {
        const { handleSubmit } = { ...this.props };
        handleSubmit();
        $(`#confirmationModal`).modal("hide");
    }

    handleCancel() {
        $(`#confirmationModal`).modal("hide");
    }

    render() {
        return (
            <div class="modal fade delete-modal" id="confirmationModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true" />
                            <p class="text-center" style={{ wordBreak: "break-word" }}>
                                Copying this workstream will assign the tasks included to a default user. Please don't forget to edit and re-assign the tasks to other project member.
                            </p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={this.handleSubmit}>
                                            Submit
                                        </button>
                                    </div>
                                </div>
                                <div class="flex-col">
                                    <button type="button" class="btn btn-secondary" onClick={this.handleCancel}>
                                        Cancel
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
