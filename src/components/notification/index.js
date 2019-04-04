import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
import NotificationActionTab from "./notificationActionTab";
import NotificationlList from "./notificationList"

@connect((store) => {
    return {
        project: store.project,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    render() {
        console.log(`here`)
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