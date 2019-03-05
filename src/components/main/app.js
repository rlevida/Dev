import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Route, Switch } from 'react-router-dom';

import { getData } from '../../globalFunction';

import Menu from "./menu";
import Home from "../home";
import Projects from "../project";
import MyTasks from "../myTasks";
import Users from "../users";

@connect((store) => {
    return {
        user: store.loggedUser.data,
        reminder: store.reminder
    }
})
class Main extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
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
        const { dispatch, user } = this.props;
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
        const { location } = { ...this.props };
        const pages = [
            {
                label: "Dashboard",
                icon: "fa-home",
                path_name: "",
                component: Home,
                exact: true,
                show_menu: true
            },
            {
                label: "Projects",
                icon: "fa-calendar",
                path_name: "projects",
                component: Projects,
                show_menu: true
            },
            {
                label: "My Tasks",
                icon: "fa-list",
                path_name: "my-tasks",
                component: MyTasks,
                show_menu: true
            },
            {
                label: "Users and Teams",
                icon: "fa-users",
                path_name: "users-and-team",
                component: Users,
                show_menu: true
            }
        ];

        const currentPath = this.props.location.pathname;
        const parentPath = currentPath.split("/")[1];
        const currentPage = _.find(pages, (page) => { return page.path_name == parentPath });
        
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
                        <Menu
                            pages={_.filter(pages, (page) => { return page.show_menu == true })}
                            current_page={currentPage}
                        />
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
                                    {
                                        (_.isEmpty(currentPage) == false) && <h3 style={{ textTransform: 'capitalize', marginTop: 0, marginBottom: 0 }}>
                                            {currentPage.label}
                                        </h3>
                                    }
                                </div>
                                <div class="action">
                                    <a class="dropdown-toggle" href={`/reminder`}>
                                        <span class="fa fa-bell"></span>
                                    </a>
                                    <a data-tip="profile" href={"/profile"}>
                                        <i class="glyphicon glyphicon-user"></i>
                                    </a>
                                </div>
                            </div>
                        </header>
                        <div id="content">
                            <Switch>
                                {
                                    _.map(pages, (page, index) => {
                                        return (
                                            <Route
                                                exact={(typeof page.exact != "undefined") ? page.exact : false}
                                                path={`/${page.path_name}`}
                                                component={page.component}
                                                key={index}
                                            />
                                        )
                                    })
                                }
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(Main);