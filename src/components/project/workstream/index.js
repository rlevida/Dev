import React from "react";
import List from "./list"
import Form from "./form"

import { connect } from "react-redux"
@connect((store) => {
    return {
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
        let { workstream } = this.props
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