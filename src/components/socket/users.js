import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("FRONT_USER_LIST",(data) => {
            dispatch({type:"SET_USER_LIST",list : data})
        })

        socket.on("FRONT_TRAINER_LIST",(data) => {
            dispatch({type:"SET_TRAINER_LIST",list : data})
        })

        socket.on("FRONT_USER_SELECTED",(data) => {
            dispatch({type:"SET_USER_SELECTED",Selected : data})
            dispatch({type:"SET_USER_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_USER_ADD",(data) => {
            dispatch({type:"SET_USER_SELECTED",Selected : {}})
        })

        socket.on("FRONT_USER_EDIT",(data) => {
            dispatch({type:"UPDATE_DATA_USER_LIST",UpdatedData:data, List: this.props.users.List})
            dispatch({type:"SET_USER_SELECTED",Selected : {}})
            dispatch({type:"SET_USER_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_USER_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_USER_LIST",id : data.id, List: this.props.users.List})
            showToast("success","User already deleted.")
        })

        socket.on("FRONT_USER_ACTIVE",(data) => {
            dispatch({type:"SET_USER_STATUS",record:data})
        })
    }

    render() { return <div> </div> }
}