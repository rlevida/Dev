import React from "react"

import Header from "../partial/header"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { task } = this.props
        let Component = <div>
            {task.FormActive == "List" &&
                <List />
            }
        </div>
        return (
            <Header component={Component} page={"My Task"} />
        )
    }
}