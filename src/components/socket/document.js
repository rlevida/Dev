import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        folder: store.folder
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("FRONT_DOCUMENT_LIST",(data) => {
            dispatch({type:"SET_DOCUMENT_LIST",list : data })
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" })
        })

        socket.on("FRONT_DOCUMENT_SELECTED",(data) => {
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected : data})
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE",FormActive : "Form"})
        })

        socket.on("FRONT_DOCUMENT_ADD",(data) => {
            dispatch({type:"ADD_DOCUMENT_LIST",list : data })
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" , filter : { tagType : "document" } })
        })

        socket.on("FRONT_DOCUMENT_EDIT",(data) => {
            dispatch({type:"UPDATE_DATA_DOCUMENT_LIST",UpdatedData:data, List: this.props.document.List})
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected : {}})
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE",FormActive : "List"})
        })

        socket.on("FRONT_DOCUMENT_DELETED",(data) => {
            dispatch({type:"REMOVE_DELETED_DOCUMENT_LIST",id : data.id, List: this.props.document.List})
            showToast("success","Document already deleted.")
        })

        socket.on("FRONT_DOCUMENT_ACTIVE",(data) => {
            dispatch({type:"SET_DOCUMENT_STATUS",record:data})
        })

        socket.on("FRONT_COMMENT_LIST",(data) =>{
           dispatch({ type:"SET_COMMENT_LIST", list: data })
        })

        socket.on("FRONT_COMMENT_ADD",(data) => {
            dispatch({ type:"ADD_COMMENT_LIST", list: data })
        })

        socket.on("FRONT_STARRED_LIST",(data) =>{
            dispatch({type:"SET_STARRED_LIST", list : data})
        })

        socket.on("RETURN_FRONT_SAVE_STARRED",(data) =>{
            dispatch({type:"ADD_STARRED_LIST", list : data})
        })

        socket.on("FRONT_DELETE_STARRED" , (data) =>{
            dispatch({type:"REMOVE_DELETED_STARRED_LIST", id : data.id })
        })

        socket.on("FRONT_FOLDER_ADD",(data)=>{
            dispatch({ type:"ADD_FOLDER_LIST", list: data })
        })

        socket.on("FRONT_FOLDER_EDIT",(data)=>{
            dispatch({type:"UPDATE_DATA_FOLDER_LIST",UpdatedData:data, List: this.props.folder.List})
            dispatch({type:"SET_DOCUMENT_SELECTED",Selected : {}})
        })

        socket.on("FRONT_FOLDER_LIST",(data)=>{
            dispatch({ type:"SET_FOLDER_LIST", list: data })
        })

        socket.on("FRONT_DELETE_FOLDER" , (data) =>{
            dispatch({type:"REMOVE_DELETED_FOLDER_LIST", id : data.id , List: this.props.folder.List})
        })

        socket.on("FRONT_SAVE_OR_UPDATE_FOLDER_TAG",(data)=>{
            dispatch({type:"SET_DOCUMENT_FORM_ACTIVE",FormActive : "List"})
            socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" })
        })
    }

    render() { return <div> </div> }
}