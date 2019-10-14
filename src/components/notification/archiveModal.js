import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData } from "../../globalFunction";
import { withRouter } from "react-router";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        notification: store.notification
    };
})
class ArchiveModal extends React.Component {
    constructor(props) {
        super(props);

        _.map(["archiveNotification"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    archiveNotification() {
        const { dispatch, loggedUser, notification } = { ...this.props };
        const { Selected } = { ...notification };
        
        putData(`/api/notification/${Selected.archiveType === "all" ? "archiveAll" : "archive"}/${Selected.id}?page=1&usersId=${loggedUser.data.id}`, { isArchived: 1 }, c => {
            if (Selected.archiveType === "all") {
                dispatch({ type: "RESET_NOTIFICATION", List: [], Count: {} });
            } else {
                dispatch({ type: "REMOVE_NOTIFICATION", id: Selected.id });
            }
            showToast("success", "Successfully Archived.");
            $(`#archiveModal`).modal("hide");
        });
    }

    render() {
        const { notification } = { ...this.props };
        const { Selected } = { ...notification };

        return (
            <div class="modal fade delete-modal" id="archiveModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Archive {Selected.archiveType || ""} this notification?</p>
                            <p class="warning text-center">
                                <strong>{Selected.origin}</strong>
                            </p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={() => this.archiveNotification()}>
                                            Yes
                                        </button>
                                    </div>
                                </div>
                                <div class="flex-col">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">
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

export default withRouter(ArchiveModal);
