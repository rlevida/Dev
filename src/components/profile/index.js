import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import Form from "./form"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { socket, project, dispatch } = this.props
        let Component = <div>
                <Form />
            </div>
        return (
            <Header component={Component} page={"Profile"} />
        )
    }
}