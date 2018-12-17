import React from "react"

import Header from "../partial/header"
import Form from "./form"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        project: store.project,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { project } = this.props;
        let Component = <div>
            {(project.FormActive == "List") &&
                <List />
            }

            {(project.FormActive == "Form") &&
                <Form />
            }
        </div>
        return (
            <Header component={Component} page={"Projects"} />
        )
    }
}