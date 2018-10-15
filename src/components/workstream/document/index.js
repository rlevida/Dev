import React from "react";
import List from "./list"
import Form from "./form"
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users : store.users,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        folder : store.folder

    }
})
export default class WorkstreamDocumentViewer extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { document } = this.props;
        return (
            <div>
                { (document.FormActive == "List") && 
                    <List/>
                }
                { (document.FormActive == "Form") && 
                    <Form/>
                }
            </div>
        )
    }
}