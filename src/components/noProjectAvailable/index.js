import React from "react";
import { connect } from "react-redux";
import { displayDate, getCookie } from '../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        user: store.loggedUser.data,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            miniSideMenu: (getCookie("sidemenu")) ? getCookie("sidemenu") : "false",
        }
        this.handleLogout = this.handleLogout.bind(this)
    }

    handleLogout() {
        let { socket } = this.props
        socket.emit("LOGOUT", {})
    }

    render() {
        let { user } = this.props
        let userView = "";
        if (user.username != "") {
            userView = <div class="headAccess"> Welcome : {user.username}</div>;
        }
        return (
            <div>
                <div class={((this.state.miniSideMenu == "true") ? "sidebar-left-mini" : "") + " bg-dark dk "} id="wrap">
                    <div class="pull-right" style={{ marginTop: "10px" }}>
                        <div class="btn-group">
                            <a data-tip="profile" href="javascript:void(0)" class="btn btn-default ">
                                <i class="glyphicon glyphicon-user"></i>
                            </a>
                        </div>
                    </div>

                    <header class="head">
                        <div class="search-bar">
                            <h3>Cloud CFO</h3>
                        </div>
                        <div class="main-bar">
                            <h3 style={{ 'text-transform': 'capitalize' }}>
                                <i class="glyphicon glyphicon-dashboard"></i>&nbsp;
                            {(this.props.page)}{this.props.form ? " > " + this.props.form : ""}{(this.props.form) == "Form" ? (this.props.formId > 0 ? " > Edit " : " > Add ") : ""}

                            </h3>
                        </div>
                    </header>
                    <div id="left">
                        <div class="media user-media bg-dark dker">
                            <div class="user-media-toggleHover">
                                <span class="glyphicon glyphicon-user"></span>
                            </div>
                            <div class="user-wrapper bg-dark">
                                <a class="user-link" href="javascript:void(0)">
                                    <img class="media-object img-thumbnail user-img" alt="User Picture" src="/images/user.gif" />
                                </a>

                                <div class="media-body">
                                    <h5 class="media-heading"><p style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "120px" }} title={user.username}>{user.username}</p></h5>
                                    <ul class="list-unstyled user-info">
                                        <li>{user.userType}</li>
                                        <li>Last Updated: <br />
                                            <small><i class="glyphicon glyphicon-calendar"></i>&nbsp;{displayDate(user.date_updated)}</small>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <ul id="menu" class="bg-dark dker">
                            <li><a href="javascript:void(0)" onClick={this.handleLogout} class="menu-list"><span class="fa fa-sign-out"></span><span class="link-title"> Logout</span></a></li>
                        </ul>
                    </div>
                    <div id="content">
                        <div class="outer" style={{ minHeight: "400px" }}>
                            <div class="inner bgcolor-gray lter" style={{ minHeight: "500px" }}>
                                <div><h1>No Project Available</h1></div>
                                <footer class="Footer bg-dark">
                                    <p>© 2013-{(new Date()).getFullYear()} All Rights Reserved. - Powered by <a class="red-text text-lighten-1" href="http://www.mobbizsolutions.com/" target="_blank">Mobbiz Solutions</a></p>
                                </footer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
