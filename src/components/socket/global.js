import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch } = this.props;

        socket.on("RETURN_ERROR_MESSAGE", function (data) {
            showToast("error", data.message);
        })

        socket.on("RETURN_SUCCESS_MESSAGE", function (data) {
            showToast("success", data.message);
        })

        socket.on("RELOAD_PAGE", function (data) {
            alert("Your page is idle for a long time, Please re-login.");
            location.reload();
        })

        socket.on("RETURN_LOGOUT", (data) => {
            setTimeout(function () {
                window.location.replace('/');
            }, 1000);
            dispatch({
                type: "SET_LOGGED_USER_DATA", data: {
                    username: "",
                    emailAddress: "",
                    userType: ""
                }
            })
            showToast("success", data.message);

        })

        socket.on("RETURN_LOGGED_USER", (data) => {
            dispatch({ type: "SET_LOGGED_USER_DATA", data: data.data })
        })

        socket.on("GET_SETTINGS_RETURN", function (data) {
            data.map((e, i) => {
                dispatch({ type: "UPDATE_SETTINGS", name: e.name, value: e.value });
            })
        })

        socket.on("DONE_SENDING_FORGOT_PASSWORD_EMAIL", function (data) {
            showToast("success", "Email sent.");
            $('#modal').modal('hide');
            $('#modal form *').val("");
        })

        socket.on("DONE_SENDING_FORGOT_PASSWORD_EMAIL_FAILED", function (data) {
            showToast("error", data.message);
        })

        socket.on("COMPLETE_FORGOT_PASSWORD_FAILED", function (data) {
            showToast("error", "Something went wrong. Please try again later.");
        })

        socket.on("COMPLETE_FORGOT_PASSWORD_SUCCESS", function (data) {
            showToast("success", "Password successfully change. You'll be redirect to login page.");
            setTimeout((e) => {
                window.location.replace('/');
            }, 1000);
        })

        socket.on("FRONT_APPLICATION_SELECT_LIST", (data) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: data.data, name: data.name })
        })
    }

    render() { return <div> </div> }
}