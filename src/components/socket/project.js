import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        company: store.company,
        project: store.project
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

        socket.on("FRONT_PROJECT_COUNT_LIST",(data) => {
            dispatch({type:"SET_PROJECT_COUNT_LIST",list : data})
        })

        socket.on("FRONT_PROJECT_SELECTED",(data) => {
            dispatch({type:"SET_PROJECT_SELECTED",Selected : data})
            dispatch({type:"SET_PROJECT_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_PROJECT_ADD",(data) => {
            if (typeof data.projectId != 'undefined') {
                this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: data.projectId, linkType: 'project' } });
            }
            dispatch({type:"SET_PROJECT_SELECTED",Selected : data})
            dispatch({type:"SET_PROJECT_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_PROJECT_EDIT",(data) => {
            socket.emit("GET_MEMBERS_LIST", { filter: { linkId: data.id, linkType: 'project' } });
            dispatch({type:"SET_PROJECT_SELECTED",Selected : data })
            dispatch({type:"SET_PROJECT_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_PROJECT_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_PROJECT_LIST",id : data.id})
            showToast("success","Company already deleted.")
        })

        socket.on("FRONT_PROJECT_ACTIVE",(data) => {
            dispatch({type:"SET_PROJECT_STATUS",record:data})
        })

        socket.on("FRONT_ARCHIVE_PROJECT",(data) => {
            dispatch({type:"ARCHIVE_PROJECT",id:data.id })
        })
    }

    render() { return <div> </div> }
}