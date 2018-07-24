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

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("AUTHENTICATION_RETURN",(data) => {
            setTimeout(() => {
                window.location.replace('/');
            }, 1000);
        })
    }

    render() { return <div> </div> }
}