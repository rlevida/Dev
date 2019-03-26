import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Route, Switch, Link } from 'react-router-dom';

import { getData } from '../../globalFunction';

import Menu from "./menu";
import Home from "../home";
import Projects from "../project";
import MyTasks from "../myTasks";
import Users from "../users";
import Profile from "../profile";
import Conversations from "../conversations";
import projectNotAvailable from "../projectNotAvailable";

@connect((store) => {
    return {
        user: store.loggedUser.data,
        project: store.project,
        reminder: store.reminder,
        loggedUser: store.loggedUser
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
        this.showRight = this.showRight.bind(this)
    }

    showLeft() {
        const { showLeft, showRight } = { ...this.state };
        this.setState({ showLeft: !showLeft, showRight: !showRight });
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

    showRight() {

    }

    render() {
        const { showLeft } = { ...this.state };
        const { project, loggedUser } = { ...this.props };
        const { avatar } = loggedUser.data;
        let pages = [
            {
                label: "Dashboard",
                icon: "fa-home",
                path_name: "",
                component: Home,
                exact: true,
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
                label: "Messages",
                icon: "fa-comments",
                path_name: "messages",
                component: Conversations,
                show_menu: true
            },
            {
                label: "Users and Teams",
                icon: "fa-users",
                path_name: "users-and-team",
                component: Users,
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
                label: "Profile",
                path_name: "profile",
                component: Profile,
                show_menu: false
            },
            {
                label: "projectNotAvailable",
                path_name: "projectNotAvailable",
                component: projectNotAvailable,
                show_menu: false
            }
        ];

        if (loggedUser.data.userType === "External") {
            pages = _.filter(pages, (e) => e.path_name !== 'users-and-team')
        }

        const currentPath = this.props.location.pathname;
        const parentPath = currentPath.split("/")[1];
        const currentPage = _.find(pages, (page) => { return page.path_name == parentPath });
        const getProjectDetailsPath = currentPath.split("/");
        const showProjectMenu = (getProjectDetailsPath[2] == project.Selected.id && typeof project.Selected.id != "undefined");
        const currentProjectPage = (typeof getProjectDetailsPath[3] == "undefined") ? "dashboard" : getProjectDetailsPath[3];
        const projectMenu = [
            { label: "Info", link: "/info" },
            { label: "Dashboard", link: "" },
            { label: "Workstreams", link: "/workstreams" },
            { label: "Calendar", link: "/calendar" },
            { label: "Messages", link: "/messages" },
            { label: "Files", link: "/files" }
        ];

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
                                <div class={`${(showLeft) ? "hide" : "toggle-menu"} item`}>
                                    <a onClick={() => this.showLeft()} class="text-white">
                                        <i class="fa fa-bars" aria-hidden="true"></i>
                                    </a>
                                </div>
                                <div class="title item">
                                    {
                                        (_.isEmpty(currentPage) == false) && <h3 style={{ textTransform: 'capitalize', marginTop: 0, marginBottom: 0 }}>
                                            {currentPage.label}
                                        </h3>
                                    }
                                </div>
                                {
                                    (showProjectMenu) && <div class="flex-row tab-row mb0 ml20 mr10 item hidden-sm hidden-xs">
                                        {
                                            _.map(projectMenu, (o, index) => {
                                                return (
                                                    <div class="flex-col" key={index}>
                                                        <Link to={`/projects/${project.Selected.id + o.link}`} class={`${(currentProjectPage == (o.label).toLowerCase()) ? "active" : ""}`}>
                                                            {o.label}
                                                        </Link>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                }
                                <div class="action item">
                                    <div class="hidden-sm hidden-xs text-center display-flex action-link">
                                        <a class="dropdown-toggle" href={`/reminder`}>
                                            <span class="fa fa-bell"></span>
                                        </a>
                                        <Link to={"/profile"}>
                                            <div class="menu-profile">
                                                <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                            </div>
                                        </Link>
                                    </div>
                                    <div class="dropdown visible-sm visible-xs">
                                        <a class="btn btn-action dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span class="fa fa-ellipsis-v" title="MORE"></span>
                                        </a>
                                        <div class="dropdown-menu pull-right" aria-labelledby="dropdownMenuButton">
                                            {
                                                (showProjectMenu) && _.map(projectMenu, (o, index) => {
                                                    return (
                                                        <li key={index}>
                                                            <Link to={`/projects/${project.Selected.id + o.link}`} class={`${(currentProjectPage == (o.label).toLowerCase()) ? "active" : ""}`}>
                                                                {o.label}
                                                            </Link>
                                                        </li>
                                                    )
                                                })
                                            }
                                            <li class="bt"><a>Notification</a></li>
                                            <li><Link to={"/profile"}>Profile</Link></li>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>
                        <div id="content">
                        {console.log(page.path_name)}
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