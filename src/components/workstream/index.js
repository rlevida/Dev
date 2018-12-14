import React from "react"

import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import Link from "./link"

import { connect } from "react-redux"
@connect((store) => {
    return {
        workstream: store.workstream,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { workstream } = this.props;
        const Component = <div>
            {
                (
                    (workstream.FormActive == "Form" && typeof workstream.Selected.id != "undefined") &&
                    (typeof workstream.SelectedLink != "undefined" && workstream.SelectedLink != "")
                ) && <Link />
            }

            {workstream.FormActive == "List" &&
                <List />
            }

            {workstream.FormActive == "Form" &&
                <Form />
            }

        </div>
        return (
            <Header component={Component} page={"Workstream"} />
        )
    }
}