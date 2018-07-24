import React from "react";
import ReactDOM from "react-dom";
import { showToast,getCookie } from '../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            miniSideMenu: false
        }

        this.handleLogout = this.handleLogout.bind(this)
    }

    handleLogout() {
        let { socket } = this.props
        socket.emit("LOGOUT",{})
    }

    componentDidMount(){
        this.setState({miniSideMenu:this.props.miniSideMenu})
    }

    componentWillReceiveProps(props){
        this.setState({miniSideMenu:props.miniSideMenu})
    }

    render() {
        let { loggedUser } = this.props
        
        let Menu = <ul id="menu" class="bg-dark dker">
                    <li class="nav-header">Menu</li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Users":""} class={page=="users"?"active":""}><a href="/users" class="menu-list"><i class="fa fa-user" aria-hidden="true"></i><span class="link-title"> Users</span></a></li>
                    <li class="nav-divider"></li>
                    <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
                </ul>

        return Menu
    }
}
