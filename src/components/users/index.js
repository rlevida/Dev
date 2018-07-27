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
    constructor(props) {
        super(props) 
    }

    render() {
        let { socket, users, dispatch } = this.props
        let Component = <div>
                <Team />
                <User />
            </div>
        return (
            <Header component={Component} page={"Teams"} />
        )
    }
}