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
class MarkAsReadModal extends React.Component {
    constructor(props) {
        super(props);

        _.map(["markAsReadNotification"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    async markAsReadNotification() {
        const { dispatch, loggedUser } = { ...this.props };
        putData(`/api/notification/markAllAsRead/${loggedUser.data.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, {}, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "MARK_ALL_AS_READ", list: result, Count: count });
            showToast("success", "Successfully cleared all read notifications.");
        });
        $(`#markAsReadModal`).modal("hide");
    }

    render() {
        const { notification } = { ...this.props };
        const { Selected } = { ...notification };

        return (
            <div class="modal fade delete-modal" id="markAsReadModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Mark all as read?</p>
                            <p class="warning text-center">
                                <strong>{Selected.origin}</strong>
                            </p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={this.markAsReadNotification}>
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

export default withRouter(MarkAsReadModal);
