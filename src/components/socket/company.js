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

        socket.on("FRONT_COMPANY_LIST",(data) => {
            dispatch({type:"SET_COMPANY_LIST",list : data})
        })

        socket.on("FRONT_COMPANY_SELECTED",(data) => {
            dispatch({type:"SET_COMPANY_SELECTED",Selected : data})
            dispatch({type:"SET_COMPANY_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_COMPANY_ADD",(data) => {
            dispatch({type:"SET_COMPANY_SELECTED",Selected : {}})
        })

        socket.on("FRONT_COMPANY_EDIT",(data) => {
            dispatch({type:"UPDATE_DATA_COMPANY_LIST",UpdatedData:data, List: this.props.company.List})
            dispatch({type:"SET_COMPANY_SELECTED",Selected : {}})
            dispatch({type:"SET_COMPANY_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_COMPANY_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_COMPANY_LIST",id : data.id, List: this.props.company.List})
            showToast("success","Company already deleted.")
        })

        socket.on("FRONT_COMPANY_ACTIVE",(data) => {
            dispatch({type:"SET_COMPANY_STATUS",record:data})
        })
    }

    render() { return <div> </div> }
}