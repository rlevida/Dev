import React from "react";
import { connect } from "react-redux";
import NotificationActionTab from "./notificationActionTab";
import NotificationlList from "./notificationList"
import { getData } from "../../globalFunction"

@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})

export default class Component extends React.Component {

    componentWillUnmount() {
        const { dispatch, loggedUser } = { ...this.props };
        getData(`/api/notification?usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, {}, (c) => {
            const { count, result } = { ...c.data }
            dispatch({ type: 'SET_NOTIFICATION_LIST', list: result, count: count });
        })
    }

    render() {
        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class="mb20 bb">
                            <NotificationActionTab />
                        </div>
                        <NotificationlList />
                    </div>
                </div>
            </div>
        )
    }
}