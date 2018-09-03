import React from "react"
import ReactDOM from "react-dom"

import Header from "../partial/header"
import User from "./users"
import Team from "./teams"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    render() {
        let { dispatch } = this.props
        let Component = <div>
            <div class="row pdl20 pdr20 mb20">
                <div class="col-md-6">
                    <h4 class="mt20 mb20">Team</h4>
                    <a class="more" onClick={(e) => dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "Form" })} >Add Team</a>
                    <Team />
                </div>
            </div>
            <div class="row pdl20 pdr20 mb20">
                <div class="col-md-12">
                    <h4 class="mt20 mb20">Users</h4>
                    <a class="more" onClick={(e) => dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" })} >Add User</a>
                    <User />
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"Teams"} />
        )
    }
}