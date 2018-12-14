import React from "react"
import { connect } from "react-redux"

import Header from "../partial/header"
import List from "./list"

@connect((store) => {
    return {
        document: store.document
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
        </div>
        return (
            <Header component={Component} page={"document"} />
        )
    }
}