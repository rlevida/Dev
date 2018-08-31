import React from "react";
import ReactDOM from "react-dom";
import { showToast } from '../../../globalFunction';
import Header from "../../partial/header";
import List from "./list"
import Form from "./form"
import WorkstreamDocumentViewer from "./workstreamDocumentViewer"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        projectData: store.project,
        loggedUser: store.loggedUser,
        task: store.task
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { workstream, projectData, dispatch, task } = this.props
        let Component = <div>
            {workstream.FormActive == "List" &&
                <List />
            }

            {workstream.FormActive == "Form" &&
                <Form />
            }
        </div>
        return (
            Component
        )
    }
}