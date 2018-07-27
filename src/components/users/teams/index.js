import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'
import ChangePassword from '../../global/changePassword'
import Header from "../../partial/header"
import Form from "./form"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
        this.editData = this.editData.bind(this)
    }

    componentWillMount() {

    }

    editData(id) {
        let { socket, dispatch } = this.props
        if(id == ""){
            dispatch({type:"SET_TEAM_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("GET_TEAM_DETAIL",id)
        }
    }

    render() {
        let { socket, teams, dispatch } = this.props
        return (
            <div>
                <h1>Teams</h1>
                {teams.FormActive == "List" &&
                    <List />
                }

                {teams.FormActive == "Form" &&
                    <Form />
                }
            </div>
        )
    }
}