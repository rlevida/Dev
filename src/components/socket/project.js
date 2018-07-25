import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        company: store.company
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("FRONT_PROJECT_LIST",(data) => {
            dispatch({type:"SET_PROJECT_LIST",list : data})
        })

        socket.on("FRONT_PROJECT_SELECTED",(data) => {
            dispatch({type:"SET_PROJECT_SELECTED",Selected : data})
            dispatch({type:"SET_PROJECT_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_PROJECT_ADD",(data) => {
            dispatch({type:"SET_PROJECT_SELECTED",Selected : {}})
        })

        socket.on("FRONT_PROJECT_EDIT",(data) => {
            dispatch({type:"UPDATE_DATA_PROJECT_LIST",UpdatedData:data, List: this.props.company.List})
            dispatch({type:"SET_PROJECT_SELECTED",Selected : {}})
            dispatch({type:"SET_PROJECT_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_PROJECT_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_PROJECT_LIST",id : data.id, List: this.props.company.List})
            showToast("success","Company already deleted.")
        })

        socket.on("FRONT_PROJECT_ACTIVE",(data) => {
            dispatch({type:"SET_PROJECT_STATUS",record:data})
        })
    }

    render() { return <div> </div> }
}