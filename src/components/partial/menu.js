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
                    <li data-tip={(this.state.miniSideMenu=="true")?"Home":""} class={page=="home"?"active":""}><a href="/home" class="menu-list"><i class="fa fa-home" aria-hidden="true"></i><span class="link-title">&nbsp; Home</span></a></li>
                    <li class="dropdown">
                        <a href="/dashboard" class="dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-calendar"></i>
                            <span class="link-title">&nbsp; Project</span> 
                            <span class="fa arrow"></span> 
                        </a> 
                        <ul class="collapse in">
                            <li>
                                <a href="/dashboard">
                                <i class="fa fa-angle-right"></i>&nbsp; Dashboard </a> 
                            </li>
                            <li>
                                <a href="/tasks">
                                <i class="fa fa-angle-right"></i>&nbsp; My Tasks </a> 
                            </li>
                        </ul>
                    </li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Teams":""} class={page=="teams"?"active":""}><a href="/teams" class="menu-list"><i class="fa fa-users" aria-hidden="true"></i><span class="link-title">&nbsp; Teams</span></a></li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Wikis":""} class={page=="users"?"active":""}><a href="/wikis" class="menu-list"><i class="fa fa-book" aria-hidden="true"></i><span class="link-title">&nbsp; Wikis</span></a></li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Reports":""} class={page=="users"?"active":""}><a href="/reports" class="menu-list"><i class="fa fa-bar-chart" aria-hidden="true"></i><span class="link-title">&nbsp; Reports</span></a></li>
                    <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
                </ul>

        return Menu
    }
}
