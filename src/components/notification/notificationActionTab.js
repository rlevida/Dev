import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { withRouter } from "react-router";
import { putData, showToast } from "../../globalFunction";

let delayTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        notification: store.notification
    }
})

class NotificationActionTab extends React.Component {
    constructor(props) {
        super(props);
        _.map([], (fn) => { this[fn] = this[fn].bind(this) });
    }


    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_NOTIFICATION_FILTER", Filter: { [name]: e } })
    }

    archive() {
        const { dispatch, notification, loggedUser } = { ...this.props }
        const { List } = { ...notification };
        const notificationIds = List.map((e) => { return e.id });

        putData(`/api/notification/archive/${notificationIds}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isArchived: 1 }, (c) => {
            const { count, result } = { ...c.data };
            dispatch({ type: 'SET_NOTIFICATION_LIST', list: result, count: count });
            showToast('success', 'Successfully Archived.');
        })
    }

    render() {
        const { notification } = { ...this.props };
        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            <div class="flex-col">
                                <a class={notification.Filter.status === 'active' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'active')}>Notification</a>
                            </div>
                            <div class="flex-col">
                                <a class={notification.Filter.status === 'archived' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'archived')}>Archived</a>
                            </div>
                            <div class="flex-col">

                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
                            <a class="btn btn-default mr10" onClick={() => this.archive()}>
                                <span>
                                    <i class="fa fa-archive mr10" aria-hidden="true"></i>
                                    Archive All
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(NotificationActionTab);