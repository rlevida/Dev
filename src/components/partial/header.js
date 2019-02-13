import React from "react"

import { displayDate, setCookie, getCookie, getData } from '../../globalFunction'
import Menu from "./menu"

import { connect } from "react-redux"
@connect((store) => {
    return {
        user: store.loggedUser.data,
        reminder: store.reminder
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            miniSideMenu: (getCookie("sidemenu")) ? getCookie("sidemenu") : "false",
            showLeft: true,
            showMore: "",
            reminderCount: 0,
            getReminder: true
        }
        this.showLeft = this.showLeft.bind(this)
    }

    showLeft() {
        const { showLeft } = { ...this.state };
        this.setState({ showLeft: !showLeft });
    }

    componentWillMount() {
        let { dispatch, user } = this.props;
        getData(`/api/reminder?usersId=${user.id}`, {}, (c) => {
            dispatch({ type: "SET_REMINDER_LIST", list: c.data })
        })

        getData(`/api/globalORM/settings`, {}, (c) => {
            dispatch({ type: 'UPDATE_SETTINGS', value: c.data.value, name: 'imageUrl' })
        })

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

    render() {
        const { showLeft } = { ...this.state };
        const { user, reminder } = { ...this.props };
        const userView = (user.username != "") ? <div class="headAccess"> Welcome : {user.username}</div> : "";
        let reminderUnseen = _.orderBy(reminder.List.filter(e => { return !e.seen && e.usersId == user.id }), ['dateAdded'], ['desc']);

        return (
            <div class={(showLeft) ? 'flex-row' : ''} id="main-container">
                {(showLeft) &&
                    <div class="menu-bar flex-col">
                        <div class="site-logo">
                            <img src="/images/cloudcfo-flogo.png" class="img-responsive" />
                        </div>
                        <a id="close-menu" onClick={() => this.showLeft()}>
                            <span class="fa fa-chevron-left text-white"></span>
                        </a>

                        <Menu miniSideMenu={this.state.miniSideMenu} />

                    </div>
                }
                <div class="flex-col content-div">
                    <div class={((this.state.miniSideMenu == "true") ? "sidebar-left-mini" : "") + ""} id="wrap">
                        <header class="head shadow-dark-div">
                            <div class="main-bar">
                                <div class={(showLeft) ? "hide" : "toggle-menu"}>
                                    <a onClick={() => this.showLeft()} class="text-white">
                                        <i class="fa fa-bars" aria-hidden="true"></i>
                                    </a>
                                </div>
                                <div class="title">
                                    <h3 style={{ textTransform: 'capitalize', marginTop: 0, marginBottom: 0 }}>
                                        {(this.props.page)}{this.props.form ? " > " + this.props.form : ""}{(this.props.form) == "Form" ? (this.props.formId > 0 ? " > Edit " : " > Add ") : ""}
                                    </h3>
                                </div>
                            </div>
                        </header>
                        <div id="content">
                            <div>{this.props.component}</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}