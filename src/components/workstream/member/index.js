import React from "react"

import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        return (
            <div>
                <List />
            </div>
        )
    }
}