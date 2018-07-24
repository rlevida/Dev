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
        company: store.company,
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
            dispatch({type:"SET_COMPANY_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("GET_COMPANY_DETAIL",id)
        }
    }

    render() {
        let { socket, company, dispatch } = this.props
        let Component = <div>
                {company.FormActive == "List" &&
                    <List />
                }

                {company.FormActive == "Form" &&
                    <Form />
                }
            </div>
        return (
            <Header component={Component} page={"Company"} />
        )
    }
}