import React from "react"
import Header from "../partial/header"
import Form from "./form"

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
        let Component = <div>
            <Form />
        </div>
        return (
            <Header component={Component} page={"Profile"} />
        )
    }
}