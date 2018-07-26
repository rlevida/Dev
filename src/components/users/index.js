import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'
import ChangePassword from '../global/changePassword'
import Header from "../partial/header"
import Form from "./form"
import List from "./list"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
        this.editData = this.editData.bind(this)
        this.savePassword = this.savePassword.bind(this)
    }

    componentWillMount() {

    }

    editData(id) {
        let { socket, dispatch } = this.props
        if(id == ""){
            dispatch({type:"SET_USER_FORM_ACTIVE", FormActive: "Form" })
        }else{
            socket.emit("GET_USER_DETAIL",id)
        }
    }

    savePassword(data) {
        let { socket, users } = this.props;

        if (Object.keys(data).length != 2) {
            showToast('error', 'Please fill all of the necessary fields.');
        } else if (data.password != data.confirmPassword) {
            showToast('error', 'Password and confirm password must be the same.');
        } else if (data.password.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
        } else {
            let token = localStorage.getItem('token');
            data.Id = users.SelectedId;
            socket.emit("CHANGE_USER_PASSWORD",data);
        }
    }

    render() {
        let { socket, users, dispatch } = this.props
        let Component = <div>
                {users.FormActive == "List" &&
                    <List />
                }

                {users.FormActive == "Form" &&
                    <Form />
                }
                {users.FormActive == "ChangePassword" &&
                    <ChangePassword onSubmitForm={this.savePassword} backToList={()=>{
                        dispatch({type:"SET_USER_ID", SelectedId : ""}) 
                        dispatch({type: "SET_USER_FORM_ACTIVE", FormActive: "List" })
                    }} />
                }
            </div>
        return (
            <Header component={Component} page={"Users"} />
        )
    }
}