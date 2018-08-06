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
        if(typeof project != "undefined" && project){
            this.props.socket.emit("GET_PROJECT_DETAIL",{id:project})
        }
        this.setState({miniSideMenu:this.props.miniSideMenu})
    }

    componentWillReceiveProps(props){
        this.setState({miniSideMenu:props.miniSideMenu})
    }

    render() {
        let { loggedUser } = this.props
        let Menu = <ul id="menu" class="bg-dark dker">
                    <li class="nav-header">Menu</li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Home":""} class={page=="index"?"active":""}><a href="/" class="menu-list"><i class="fa fa-home" aria-hidden="true"></i><span class="link-title">&nbsp; Home</span></a></li>
                    <li class="dropdown">
                        <a href="/project" class="dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-calendar"></i>
                            <span class="link-title">&nbsp; Project</span> 
                            <span class="fa arrow"></span> 
                        </a> 
                        <ul class="collapse in">
                            <li class={page == "project" && subpage==""?"active":""}>
                                <a href="/project">
                                <i class="fa fa-angle-right"></i>&nbsp; Dashboard </a> 
                            </li>
                            <li class={page == "mytask" && subpage==""?"active":""}>
                                <a href="/mytask">
                                <i class="fa fa-angle-right"></i>&nbsp; My Tasks </a> 
                            </li>
                        </ul>
                    </li>
                    { (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 || loggedUser.data.userRole == 3) &&
                        <li data-tip={(this.state.miniSideMenu=="true")?"Teams":""} class={page=="users"?"active":""}><a href="/users" class="menu-list"><i class="fa fa-users" aria-hidden="true"></i><span class="link-title">&nbsp; Teams</span></a></li>
                    }
                    <li data-tip={(this.state.miniSideMenu=="true")?"Wikis":""} class={page=="wikis"?"active":""}><a href="/wikis" class="menu-list"><i class="fa fa-book" aria-hidden="true"></i><span class="link-title">&nbsp; Wikis</span></a></li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Reports":""} class={page=="reports"?"active":""}><a href="/reports" class="menu-list"><i class="fa fa-bar-chart" aria-hidden="true"></i><span class="link-title">&nbsp; Reports</span></a></li>
                    <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
                </ul>

        if(page=="project" && subpage != ""){
            Menu = <ul id="menu" class="bg-dark dker">
                    <li class="nav-header">Menu</li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Home":""} class={page=="index"?"active":""}><a href="/" class="menu-list"><i class="fa fa-home" aria-hidden="true"></i><span class="link-title">&nbsp; Home</span></a></li>
                    <li class="dropdown">
                        <a href={"/project/"+project} class="dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-calendar"></i>
                            <span class="link-title">&nbsp; Documents</span> 
                            <span class="fa arrow"></span> 
                        </a> 
                        <ul class="collapse in">
                            <li class={page == "project" && subpage=="documents"?"active":""}>
                                <a href={"/project/documents/"+project}>
                                <i class="fa fa-angle-right"></i>&nbsp; Library </a> 
                            </li>
                            <li class={page == "project" && subpage=="trash"?"active":""}>
                                <a href={"/project/trash/"+project}>
                                <i class="fa fa-angle-right"></i>&nbsp; Trash </a> 
                            </li>
                        </ul>
                    </li>
                    <li class="dropdown">
                        <a href={"/project/documents"+project} class="dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-calendar"></i>
                            <span class="link-title">&nbsp; Processes</span> 
                            <span class="fa arrow"></span> 
                        </a> 
                        <ul class="collapse in">
                            <li class={page == "project" && subpage=="processes"?"active":""}>
                                <a href={"/project/processes/"+project}>
                                <i class="fa fa-angle-right"></i>&nbsp; Workstream </a> 
                            </li>
                            <li class={page == "project" && subpage=="task"?"active":""}>
                                <a href={"/project/tasks/"+project}>
                                <i class="fa fa-angle-right"></i>&nbsp; Tasks </a> 
                            </li>
                        </ul>
                    </li>
                    <li data-tip={(this.state.miniSideMenu=="true")?"Conversations":""} class={page == "project" && subpage=="conversations"?"active":""}><a href={"/project/conversations/"+project} class="menu-list"><i class="fa fa-users" aria-hidden="true"></i><span class="link-title">&nbsp; Conversations</span></a></li>
                    <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
                </ul>
        }

        return Menu
    }
}
