import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        position: store.position
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("FRONT_POSITION_LIST",(data) => {
            dispatch({type:"SET_POSITION_LIST",list : data})
        })

        socket.on("FRONT_POSITION_SELECTED",(data) => {
            dispatch({type:"SET_POSITION_SELECTED",Selected : data})
            dispatch({type:"SET_POSITION_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_POSITION_ADD",(data) => {
            dispatch({type:"SET_POSITION_SELECTED",Selected : {}})
        })

        socket.on("FRONT_POSITION_EDIT",(data) => {
            dispatch({type:"UPDATE_DATA_POSITION_LIST",UpdatedData:data, List: this.props.position.List})
            dispatch({type:"SET_POSITION_SELECTED",Selected : {}})
            dispatch({type:"SET_POSITION_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_POSITION_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_POSITION_LIST",id : data.id, List: this.props.position.List})
            showToast("success","Position already deleted.")
        })

        socket.on("FRONT_POSITION_ACTIVE",(data) => {
            dispatch({type:"SET_POSITION_STATUS",record:data})
        })
    }

    render() { return <div> </div> }
}