import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";

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
                            <a class="btn btn-default mr10">
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