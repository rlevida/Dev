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

        socket.on("FRONT_TYPE_LIST",(data) => {
            dispatch({type:"SET_TYPE_LIST",list : data})
        })
    }

    render() { return <div> </div> }
}