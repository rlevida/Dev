import React from "react"

import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { socket, task, project, dispatch, workstream } = this.props

        return (
            <div>
                <h4 style={{paddingLeft:"20px"}}>&nbsp;&nbsp;&nbsp;>&nbsp;{workstream.Selected.workstream}</h4>
                <List />
            </div>
        )
    }
}