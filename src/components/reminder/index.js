import React from "react"
import ReactDOM from "react-dom"
import Header from "../partial/header"
import List from "./list"
import Form from "./form"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        reminder: store.reminder
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { socket, reminder, dispatch } = this.props
        let Component = <div>
                {reminder.FormActive == "List" &&
                    <List />
                }

                {reminder.FormActive == "Form" &&
                    <Form />
                }
            </div>
        return (
            <Header component={Component} page={"document"} />
        )
    }
}