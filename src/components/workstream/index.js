import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import Header from "../partial/header"
import Form from "./form"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
        this.editData = this.editData.bind(this)
    }

    editData(id) {
        let { socket, dispatch } = this.props
        if(id == ""){
            dispatch({type:"SET_workspace_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("GET_WORKSTREAM_DETAIL",id)
        }
    }

    render() {
        let { socket, workstream, dispatch } = this.props
        let Component = <div>
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