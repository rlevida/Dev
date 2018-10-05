import React from "react"
import ReactDOM from "react-dom"
import ToolTip from "react-tooltip"

import { showToast, displayDate, setCookie, getCookie, NationalityList, CountryList } from '../../globalFunction'
import Menu from "./menu"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        user: store.loggedUser.data,
        reminder: store.reminder
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            miniSideMenu: (getCookie("sidemenu")) ? getCookie("sidemenu") : "false",
            showLeft: false,
            showMore: "",
            reminderCount: 0,
            getReminder: true
        }
        this.showLeft = this.showLeft.bind(this)
    }

    showLeft() {
        if (this.state.showLeft) {
            this.setState({ showLeft: false })
            $("body").removeClass("sidebar-left-opened");
        } else {
            this.setState({ showLeft: true })
            $("body").addClass("sidebar-left-opened");
        }
    }

    componentWillMount() {
        let { dispatch, socket, user } = this.props;
        socket.emit("LOGGED_USER", {});
        socket.emit("GET_SETTINGS", {});

        if (window.innerHeight <= 550) {
            this.setState({ showMore: "" })
            $("body").css("overflow-y", "auto").css("min-height", "550px")
            $("html").scrollTop(0);
        } else {
            this.setState({ showMore: "bottom" })
        }
        $(window).resize(() => {
            if (window.innerHeight <= 550) {
                this.setState({ showMore: "" })
                $("#menu").css("overflow", "hidden").css("margin-top", "0px")
                $("body").css("overflow-y", "auto").css("min-height", "550px")
            } else {
                this.setState({ showMore: "bottom" })
                $("body").css("overflow-y", "").css("min-height", "")
                $("html").scrollTop(0);
            }
        });
    }

    componentWillReceiveProps(props){
        let { socket , reminder , user } = props;
        if(!reminder.List.length && reminder.Loading ){
            socket.emit("GET_REMINDER_LIST", { filter : { usersId : user.id }})
        }
    }

    setSideMenuState(status) {
        this.setState({ miniSideMenu: status })
        setCookie("sidemenu", status, 1);
    }

    setShowMore(type) {
        if (type == "top") {
            $("#menu").css("overflow", "hidden")
                .css("margin-top",
                    "-" + (((window.innerHeight) < 767)
                        ? (767 - window.innerHeight)
                        : 0) + "px")
        } else {
            $("#menu").css("overflow", "hidden").css("margin-top", "0px")
        }
        this.setState({ showMore: type })
    }

    seenReminder() {
        let { reminder } = this.props;
    }
    render() {
        let { user, reminder, dispatch } = this.props
        let userView = "";
        if (user.username != "") {
            userView = <div class="headAccess"> Welcome : {user.username}</div>;
        }

        let reminderUnseen = _.orderBy(reminder.List.filter( e => { return !e.seen}),['dateAdded'],['desc'])
        // let reminderSeen = _.orderBy(reminder.List.filter( e => { return e.seen}),['dateAdded'],['desc'])

        return <div>
            <div class={((this.state.miniSideMenu == "true") ? "sidebar-left-mini" : "") + " bg-dark dk "} id="wrap">
                <div class="dropdown pull-right" style={{ marginTop: "10px", marginRight: "10px" }}>
                    { (reminderUnseen.length > 0) ?
                        <a class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">
                            <span class="fa fa-bell"></span>
                            <span class="label label-danger" style={{ marginLeft: "5px", display: reminderUnseen.length ? "inline-block" : "none" }}>{ reminderUnseen.length }</span>
                        </a>
                        :
                        <a  class="btn btn-default dropdown-toggle" href={`/reminder`}>
                            <span class="fa fa-bell"></span>
                        </a>
                    }

                    { (reminderUnseen.length > 0 ) &&
                        <ul class="dropdown-menu" >
                            {
                               reminderUnseen.map((data, index) => {
                                    let label = ""
                                    let description = ""
                                    if(data.type == "Task Rejected"){
                                        label = `Task`
                                        description = `${data.taskName} has been rejected by ${data.createdByName}`
                                    }else if (data.type == "For Approval"){
                                        label = `Task`
                                        description = `${data.createdByName} assigned you as approver.`
                                    }else if (data.type == "Task Overdue"){
                                        label = data.linkType == "workstream" ? `Workstream Task Overdue` : `Task Overdue`
                                        description =  `${data.reminderDetail}`
                                    }else if (data.type == "Task Due Today"){
                                        label = `Task Due Today`
                                        description = `${data.reminderDetail}`
                                    }else if (data.type == "Tag in Comment"){
                                        label = `Comment`
                                        description = `${data.createdByName} tagged you in a comment.`
                                    }else if (data.type == "Task Completed"){
                                        description = `${data.taskName} has been completed by ${data.createdByName}`
                                    }

                                    return (
                                        <li key={index} style={{height:'100%'}}>
                                            {/* <span class="label label-primary" style={{marginLeft:'5px'}}>{label}</span> */}
                                            <a href={`/reminder`} key={index} style={{ textDecoration: "none" , fontWeight:"bold" }}>
                                                <span>{description}</span>
                                                <br/>
                                            </a>
                                        </li>
                                    )
                                })
                            }

                            {
                            //    reminderSeen.map((data, index) => {
                            //         let label = ""
                            //         let description = ""
                            //         if(data.type == "Task Rejected"){
                            //             label = `Task`
                            //             description = `${data.taskName} has been rejected by ${data.createdByName}`
                            //         }else if (data.type == "For Approval"){
                            //             label = `Task`
                            //             description = `${data.createdByName} assigned you as approver.`
                            //         }else if (data.type == "Task Overdue"){
                            //             label = data.linkType == "workstream" ? `Workstream Task Overdue` : `Task Overdue`
                            //             description =  `${data.reminderDetail}`
                            //         }else if (data.type == "Task Due Today"){
                            //             label = `Task Due Today`
                            //             description = `${data.reminderDetail}`
                            //         }else if (data.type == "Tag in Comment"){
                            //             label = `Comment`
                            //             description = `${data.createdByName} tagged you in a comment.`
                            //         }else if (data.type == "Task Completed"){
                            //             description = `${data.taskName} has been completed by ${data.createdByName}`
                            //         }

                            //         return (
                            //             <li key={index} style={{height:'100%'}}>
                            //                 {/* <span class="label label-primary" style={{marginLeft:'5px'}}>{label}</span> */}
                            //                 <a href={"/reminder"} key={index} style={{ textDecoration: "none" }}>
                            //                     <span>{description}</span>
                            //                     <br/>
                            //                 </a>
                            //             </li>
                            //         )
                            //     })
                            }

                        </ul>
                    }
                </div>
                <div class="pull-right" style={{ marginTop: "10px" }}>
                    <div class="btn-group">
                        <a data-tip="profile" href={"/profile"} class="btn btn-default ">
                            <i class="glyphicon glyphicon-user"></i>
                        </a>
                    </div>
                </div>

                <header class="head">
                    <div class="search-bar">
                        <h3>Cloud CFO</h3>
                    </div>
                    <div class="main-bar">
                        <h3 style={{ textTransform: 'capitalize' }}>
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
                            <a class="user-link" href={"/profile"}>
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
                    <div class="side-menu-navigator">
                        {this.state.miniSideMenu == "false" &&
                            <a data-tip="Hide Menu" href="javascript:void(0);" onClick={e => this.setSideMenuState("true")} ><span class="glyphicon glyphicon-menu-left"></span><ToolTip /></a>
                        }
                        {this.state.miniSideMenu == "true" &&
                            <a data-tip="Show Menu" href="javascript:void(0);" onClick={e => this.setSideMenuState("false")}><span class="glyphicon glyphicon-menu-right"></span><ToolTip /></a>
                        }
                    </div>
                    <div class="side-menu-navigator">
                        {this.state.showMore == "bottom" &&
                            <a data-tip="Show Bottom Menu" href="javascript:void(0);" onClick={e => this.setShowMore("top")} ><span class="glyphicon glyphicon-chevron-up"></span><ToolTip /></a>
                        }
                    </div>
                    <Menu miniSideMenu={this.state.miniSideMenu} />
                    <div class="side-menu-navigator">
                        {this.state.showMore == "top" &&
                            <a data-tip="Show Top Menu" href="javascript:void(0);" onClick={e => this.setShowMore("bottom")}><span class="glyphicon glyphicon-chevron-down"></span><ToolTip /></a>
                        }
                    </div>
                </div>
                <div id="content">
                    <div class="outer" style={{ minHeight: "400px" }}>
                        <div class="inner bgcolor-gray lter" style={{ minHeight: "500px" }}>
                            <div>{this.props.component}</div>
                            <footer class="Footer bg-dark">
                                <p>© 2013-{(new Date()).getFullYear()} All Rights Reserved. - Powered by <a class="red-text text-lighten-1" href="http://www.mobbizsolutions.com/" target="_blank">Mobbiz Solutions</a></p>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}