import React from "react"
import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import DocumentViewer from "./documentViewer"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { document } = this.props
        let Component = <div>
                {document.FormActive == "List" &&
                    <List />
                }
                {document.FormActive == "Form" &&
                    <Form />
                }
                {document.FormActive == "DocumentViewer" &&
                    <DocumentViewer />
                }
            </div>
        return (
            <Header component={Component} page={"document"} />
        )
    }
}