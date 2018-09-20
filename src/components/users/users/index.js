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

    componentDidMount() {
        let intervalLoggedUser = setInterval(() => {
            if (typeof this.props.loggedUser.data.id != "undefined") {
                let filter = {}
                if (this.props.loggedUser.data.userRole != "1" && this.props.loggedUser.data.userRole != "2") {
                    filter = {
                        filter: {
                            id: { name: "id", value: this.props.loggedUser.data.projectIds, condition: " IN " }
                        }
                    }
                }
                this.props.socket.emit("GET_PROJECT_LIST", filter);
                clearInterval(intervalLoggedUser)
            }
        }, 1000)
    }

    editData(id) {
        let { socket, dispatch } = this.props
        if (id == "") {
            dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" })
        } else {
            socket.emit("GET_USER_DETAIL", id)
        }
    }

    savePassword(data) {
        let { socket, users, dispatch } = this.props;

        if (Object.keys(data).length != 2) {
            showToast('error', 'Please fill all of the necessary fields.');
        } else if (data.password != data.confirmPassword) {
            showToast('error', 'Password and confirm password must be the same.');
        } else if (data.password.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
        } else {
            let token = localStorage.getItem('token');
            data.Id = users.SelectedId;
            socket.emit("CHANGE_USER_PASSWORD", data);
            dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" })
        }
    }

    render() {
        let { users, dispatch } = this.props
        return (
            <div>
                {users.FormActive == "List" &&
                    <List />
                }

                {users.FormActive == "Form" &&
                    <Form />
                }
                {users.FormActive == "ChangePassword" &&
                    <ChangePassword onSubmitForm={this.savePassword} backToList={() => {
                        dispatch({ type: "SET_USER_ID", SelectedId: "" })
                        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" })
                    }} />
                }
            </div>
        )
    }
}