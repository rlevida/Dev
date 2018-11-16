import React from "react";
import ReactDOM from "react-dom";
import { showToast, getCookie } from '../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        project: store.project
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            miniSideMenu: false
        }

        this.handleLogout = this.handleLogout.bind(this)
    }

    handleLogout() {
        let { socket } = this.props
        socket.emit("LOGOUT", {})
    }

    componentDidMount() {
        if (typeof project != "undefined" && project) {
            this.props.socket.emit("GET_PROJECT_DETAIL", { id: project })
        }
        this.setState({ miniSideMenu: this.props.miniSideMenu })

        if (!window.location.href.includes("document") && !window.location.href.includes("trash")) {
            $(".has-submenu ul").hide();
        }
        $(".has-submenu > a").click(function () {
            $(this).next("ul").toggle();
        });
    }

    componentWillReceiveProps(props) {
        this.setState({ miniSideMenu: props.miniSideMenu })
    }

    render() {
        let { loggedUser } = this.props;
        let Menu = <ul id="menu" class="bg-dark dker">
            <li class="nav-header">Menu</li>
            <li class={page == "index" ? "active" : ""}>
                <a href="/" class="menu-list">
                    <i class="fa fa-home" aria-hidden="true"></i>
                    <span class="link-title">&nbsp; My Dashboard</span>
                </a>
            </li>
            <li class={page == "project" ? "active" : ""}>
                <a href="/project" class="menu-list">
                    <i class="fa fa-calendar" aria-hidden="true"></i>
                    <span class="link-title">&nbsp; Projects</span>
                </a>
            </li>
            <li class={page == "mytask" ? "active" : ""}>
                <a href="/mytask" class="menu-list">
                    <i class="fa fa-tasks" aria-hidden="true"></i>
                    <span class="link-title">&nbsp; My Tasks</span>
                </a>
            </li>
            {
                (loggedUser.data.userRole <= 3) && <li class={page == "users" ? "active" : ""}>
                    <a href="/users" class="menu-list">
                        <i class="fa fa-users" aria-hidden="true"></i>
                        <span class="link-title">&nbsp; Teams & Users</span>
                    </a>
                </li>
            }
            <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
        </ul>
        if ((page == "project" || page == "selectedTask") && subpage != "") {
            Menu = <ul id="menu" class="bg-dark dker">
                <li class="nav-header">Menu</li>
                <li class={page == "project" && subpage == "home" ? "active" : ""}>
                    <a href={`/project/${project}`} class="menu-list">
                        <i class="fa fa-dashboard" aria-hidden="true"></i>
                        <span class="link-title">&nbsp; Project Dashboard</span>
                    </a>
                </li>
                <li class={page == "project" && subpage == "workstream" ? "active" : ""}>
                    <a href={`/project/${project}/workstream`} class="menu-list">
                        <i class="fa fa-wpforms" aria-hidden="true"></i>
                        <span class="link-title">&nbsp; Workstreams</span>
                    </a>
                </li>
                <li class={page == "project" && subpage == "task" ? "active" : ""}>
                    <a href={`/project/${project}/task`} class="menu-list">
                        <i class="fa fa-tasks" aria-hidden="true"></i>
                        <span class="link-title">&nbsp; Tasks</span>
                    </a>
                </li>
                <li class="has-submenu">
                    <a href={"/project/" + project} class="dropdown-toggle has-submenu" data-toggle="dropdown" aria-expanded="true">
                        <i class="fa fa-calendar"></i>
                        <span class="link-title">&nbsp; Documents</span>
                        <span class="fa arrow"></span>
                    </a>
                    <ul>
                        <li style={{ backgroundColor: window.location.href.includes("document") ? "#201e1e" : "" }}>
                            <a href={`/project/${project}/documents`}>
                                <i class="fa fa-book"></i>&nbsp; Library </a>
                        </li>
                        <li style={{ backgroundColor: window.location.href.includes("trash") ? "#201e1e" : "" }}>
                            <a href={`/project/${project}/trash`}>
                                <i class="fa fa-trash"></i>&nbsp; Trash </a>
                        </li>
                    </ul>
                </li>
                <li class={page == "project" && subpage == "conversations" ? "active" : ""}>
                    <a href={"/project/conversations/" + project} class="menu-list">
                        <i class="fa fa-comments" aria-hidden="true"></i>
                        <span class="link-title">&nbsp; Conversations</span>
                    </a>
                </li>
                <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
            </ul>
        }

        return Menu
    }
}
