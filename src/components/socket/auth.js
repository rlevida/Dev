import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser : store.loggedUser
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        var { socket, dispatch } = this.props;

        socket.on("AUTHENTICATION_RETURN",(res) => {
            if(res.type == "Internal"){
                setTimeout(() => {
                    window.location.replace('/');
                }, 1000);
            }else{
                if(res.data.length){
                    if(res.data.length > 1){
                        setTimeout(() => {
                            window.location.replace(`/project/`);
                        }, 1000);
                    }else{
                        setTimeout(() => {
                            window.location.replace(`/project/${res.data[0].linkId}`);
                        }, 1000);
                    }
                }else{
                    setTimeout(() => {
                        window.location.replace('/');
                    }, 1000);
                }
            }
        })
    }

    render() { return <div> </div> }
}