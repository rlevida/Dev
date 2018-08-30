import React from "react"
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

        socket.on("FRONT_USERS_TEAM_LIST",(data) => {
            dispatch({type:"SET_USERS_TEAM_LIST",list : data})
        })
    }

    render() { return <div> </div> }
}