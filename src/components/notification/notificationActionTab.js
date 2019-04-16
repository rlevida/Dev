import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { withRouter } from "react-router";
import { putData, showToast, getData } from "../../globalFunction";

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


    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, notification } = this.props;

        if (_.isEqual(prevProps.notification.Filter, this.props.notification.Filter) == false) {
            clearTimeout(delayTimer);

            const { Filter } = { ...notification };
            let requestUrl = `/api/notification?page=${1}&usersId=${loggedUser.data.id}&isRead=0&isArchived=${Filter.isArchived}&isDeleted=${Filter.isDeleted}`;

            getData(requestUrl, {}, (c) => {
                const { count, result } = { ...c.data };
                dispatch({ type: 'SET_NOTIFICATION_LIST', list: result, count: count });
            })

            delayTimer = setTimeout(() => {
                if (status === 'active' || status === 'sort') {
                    requestUrl += `&folderId=null&type=document`
                }
            }, 1000);
        }

    }

    setDropDown(name, e) {
        const { dispatch, notification } = this.props;
        const { Filter } = { ...notification };
        dispatch({ type: "SET_NOTIFICATION_FILTER", Filter: { ...Filter, [name]: e } })
    }

    archiveAll() {
        const { dispatch, notification } = { ...this.props }
        const { List } = { ...notification };
        const notificationIds = List.map((e) => { return e.id });
        dispatch({ type: "SET_NOTIFICATION_SELECTED", Selected: { id: notificationIds, archiveType: 'all' } });
    }

    render() {
        const { notification } = { ...this.props };
        const { Filter } = { ...notification };
        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            <div class="flex-col">
                                <a class={Filter.isArchived === 0 ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('isArchived', 0)}>Notification</a>
                            </div>
                            <div class="flex-col">
                                <a class={Filter.isArchived === 1 ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('isArchived', 1)}>Archived</a>
                            </div>
                            <div class="flex-col">

                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
                            <a class="btn btn-default mr10"
                                data-toggle="modal"
                                data-target="#markAsReadModal">
                                <span>
                                    <i class="fa fa-check-circle mr10" aria-hidden="true"></i>
                                    Mark all as read
                                </span>
                            </a>
                            <a class="btn btn-default mr10"
                                onClick={() => this.archiveAll()}
                                data-toggle="modal"
                                data-target="#archiveModal">
                                <span>
                                    <i class="fa fa-archive mr10" aria-hidden="true"></i>
                                    Archive all
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