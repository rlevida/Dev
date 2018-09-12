import React from "react"
import ReactDOM from "react-dom"

import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import Link from "./link"
import WorkstreamDocumentViewer from "./workstreamDocumentViewer"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    render() {
        let { workstream } = this.props
        let Component = <div>
                { (workstream.FormActive == "Form" && typeof workstream.Selected.id != "undefined") &&
                    <Link/>
                } 
               
                {workstream.FormActive == "List" &&
                    <List />
                }

                {workstream.FormActive == "Form" &&
                    <Form />
                }
                
                {workstream.FormActive == "WorkstreamDocumentViewer" &&
                    <WorkstreamDocumentViewer/>
                }
            </div>
        return (
            <Header component={Component} page={"Workstream"} />
        )
    }
}