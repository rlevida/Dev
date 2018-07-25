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
        project: store.project,
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
            dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("SET_PROJECT_FORM_ACTIVE",id)
        }
    }

    render() {
        let { socket, project, dispatch } = this.props
        let Component = <div>
                {project.FormActive == "List" &&
                    <List />
                }

                {project.FormActive == "Form" &&
                    <Form />
                }
            </div>
        return (
            <Header component={Component} page={"Project"} />
        )
    }
}