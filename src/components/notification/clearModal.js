import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData } from "../../globalFunction";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        notification: store.notification
    }
})
class ArchiveModal extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "clearNotification"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    async clearNotification() {
        const { dispatch, loggedUser, notification } = { ...this.props }
        const notificationIds = _.filter(notification.List, (o) => { return o.isRead }).map((o) => { return o.id })

        if (notificationIds.length > 0) {
            putData(`/api/notification/archive/${notificationIds}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isDeleted: 1 }, (c) => {
                const { count, result } = { ...c.data };
                dispatch({ type: 'SET_NOTIFICATION_LIST', list: result, count: count });
                showToast('success', 'Successfully cleared all read notifications.');
            })
        } else {
            $(`#clearModal`).modal("hide");
        }
    }


    render() {
        const { notification } = { ...this.props };
        const { Selected } = { ...notification };

        return (
            <div class="modal fade delete-modal" id="clearModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Are you sure to clear all read notification?</p>
                            <p class="warning text-center"><strong>{Selected.origin}</strong></p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger" type="button" onClick={this.clearNotification}>
                                            Yes
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