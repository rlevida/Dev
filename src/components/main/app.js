import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Route, Switch, Link } from "react-router-dom";
import _ from "lodash";
import { getData, notificationType, putData, textColor } from "../../globalFunction";
import { Loading } from "../../globalComponents";

import Menu from "./menu";
import Home from "../home";
import Projects from "../project";
import MyTasks from "../myTasks";
import Users from "../users";
import Profile from "../profile";
import notAvailable from "../notAvailable";
import Notification from "../notification";

let keyTimer = "";

@connect(store => {
    return {
        user: store.loggedUser.data,
        project: store.project,
        reminder: store.reminder,
        loggedUser: store.loggedUser,
        notification: store.notification
    };
})
class Main extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLeft: true,
            showMore: "",
            reminderCount: 0,
            getReminder: true
        };
        _.map(["showLeft", "handleAdd"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    showLeft() {
        const { showLeft, showRight } = { ...this.state };
        this.setState({ showLeft: !showLeft, showRight: !showRight });
    }
    componentDidMount() {
        const self = this;
        $(".notif-wrapper").scroll(function() {
            const { notification, dispatch } = { ...self.props };
            if (this.scrollHeight - this.scrollTop < this.clientHeight + 50) {
                dispatch({ type: "SET_NOTIFICATION_LOADING", loading: "RETRIEVING" });

                keyTimer && clearTimeout(keyTimer);
                keyTimer = setTimeout(() => {
                    self.fetchNotification(notification.Count.current_page + 1);
                }, 400);
            }
        });
    }
    componentWillMount() {
        const { dispatch, user, location } = this.props;

        getData(`/api/globalORM/settings`, {}, c => {
            dispatch({ type: "UPDATE_SETTINGS", value: c.data.value, name: "imageUrl" });
        });

        if (location.pathname !== "/notification") {
            getData(`/api/notification/count?usersId=${user.id}&isRead=0&isDeleted=0&isArchived=0`, {}, c => {
                const { count } = { ...c.data };
                dispatch({ type: "SET_NOTIFICATION_COUNT", Count: count });
            });
        }

        if (window.innerHeight <= 550) {
            this.setState({ showMore: "" });
            $("body")
                .css("overflow-y", "auto")
                .css("min-height", "550px");
            $("html").scrollTop(0);
        } else {
            this.setState({ showMore: "bottom" });
        }
        $(window).resize(() => {
            if (window.innerHeight <= 550) {
                this.setState({ showMore: "" });
                $("#menu")
                    .css("overflow", "hidden")
                    .css("margin-top", "0px");
                $("body")
                    .css("overflow-y", "auto")
                    .css("min-height", "550px");
            } else {
                this.setState({ showMore: "bottom" });
                $("body")
                    .css("overflow-y", "")
                    .css("min-height", "");
                $("html").scrollTop(0);
            }
        });
    }

    setSideMenuState(status) {
        this.setState({ miniSideMenu: status });
        setCookie("sidemenu", status, 1);
    }

    setShowMore(type) {
        if (type == "top") {
            $("#menu")
                .css("overflow", "hidden")
                .css("margin-top", "-" + (window.innerHeight < 767 ? 767 - window.innerHeight : 0) + "px");
        } else {
            $("#menu")
                .css("overflow", "hidden")
                .css("margin-top", "0px");
        }
        this.setState({ showMore: type });
    }

    handleAdd(type) {
        const { dispatch, history, location } = this.props;
        let formType = "";
        let selectedType = "";

        switch (type) {
            case "task":
                if (location.pathname != "/my-tasks") {
                    history.push("/my-tasks");
                }
                formType = "SET_TASK_FORM_ACTIVE";
                selectedType = "SET_TASK_SELECTED";
                break;
            case "project":
                if (location.pathname != "/projects") {
                    history.push("/projects");
                }
                formType = "SET_PROJECT_FORM_ACTIVE";
                selectedType = "SET_PROJECT_SELECTED";
                dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
                break;
            case "user":
                if (location.pathname != "/users-and-team") {
                    history.push("/users-and-team");
                }
                formType = "SET_USER_FORM_ACTIVE";
                selectedType = "SET_USER_SELECTED";
                break;
            case "team":
                if (location.pathname != "/users-and-team") {
                    history.push("/users-and-team");
                }
                formType = "SET_TEAM_FORM_ACTIVE";
                selectedType = "SET_TEAM_SELECTED";
                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "" });
                break;
        }

        dispatch({ type: formType, FormActive: "Form" });
        dispatch({ type: selectedType, Selected: {} });
    }

    async handleNotificationRedirect(notif) {
        const { history, dispatch, loggedUser } = { ...this.props };
        const { taskId, workstreamId, projectId } = { ...notif };

        if (!notif.isRead) {
            await putData(`/api/notification/${notif.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isRead: 1 }, c => {
                dispatch({ type: "UPDATE_DATA_NOTIFICATION_LIST", updatedData: c.data });
            });
        }

        let url = `/projects/${projectId}`;
        switch (notif.type) {
            case "fileNewUpload": {
                if (notif.taskId === null) {
                    history.push(`${url}/workstreams/${workstreamId}?tab=document`);
                } else {
                    history.push(`${url}/workstreams/${workstreamId}?task-id=${taskId}`);
                }
            }
            case "fileTagged":
                {
                    history.push(`${url}/files?file-id=${notif.documentId}`);
                }
                break;
            case "messageSend":
            case "messageMentioned":
                {
                    history.push(`${url}/messages?note-id=${notif.note_notification.id}`);
                }
                break;
            case "commentReplies":
                {
                    if (notif.taskId === null) {
                        history.push(`${url}/files?file-id=${notif.documentId}`);
                    } else {
                        history.push(`${url}/workstreams/${workstreamId}?task-id=${taskId}`);
                    }
                }
                break;
            case "taskAssgined":
            case "taskAssignedComment":
            case "taskApprover":
            case "taskTagged":
            case "taskApproved":
            case "taskMemberCompleted":
            case "taskFollowingCompleted":
            case "taskDeadline":
            case "taskTeamDeadline":
            case "taskFollowingDeadline":
            case "taskResponsibleDeadLine":
            case "taskResponsibleBeforeDeadline":
            case "taskBeforeDeadline":
            case "taskAssigned":
                {
                    history.push(`${url}/workstreams/${workstreamId}?task-id=${taskId}`);
                    window.location.reload();
                }
                break;
        }
    }

    fetchNotification(page) {
        const { user, dispatch } = { ...this.props };
        getData(`/api/notification?usersId=${user.id}&isRead=0&isDeleted=0&isArchived=0&page=${page}`, {}, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_NOTIFICATION_LIST", list: result, count: count });
            dispatch({ type: "SET_NOTIFICATION_LOADING", Loading: "" });
        });
    }

    render() {
        const { showLeft } = { ...this.state };
        const { project, loggedUser, notification } = { ...this.props };
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
                label: "",
                path_name: "not-found",
                component: notAvailable
            },
            {
                label: "Notification",
                path_name: "notification",
                component: Notification,
                show_menu: false
            }
        ];
        const dropdownAddLinks = [{ id: "task", label: "Task" }, { id: "project", label: "Project" }, { id: "user", label: "User" }, { id: "team", label: "Team" }];
        const projectMenu = [
            { label: "Info", link: "/info" },
            { label: "Dashboard", link: "" },
            { label: "Workstreams", link: "/workstreams" },
            { label: "Calendar", link: "/calendar" },
            { label: "Messages", link: "/messages" },
            { label: "Files", link: "/files" }
        ];

        if (loggedUser.data.userType === "External") {
            pages = _.filter(pages, ({ path_name }) => {
                return path_name != "users-and-team";
            });
        }
        const currentPath = this.props.location.pathname;
        const parentPath = currentPath.split("/")[1];
        const currentPage = _.find(pages, page => {
            return page.path_name == parentPath;
        });
        const getProjectDetailsPath = currentPath.split("/");
        const showProjectMenu = getProjectDetailsPath[2] == project.Selected.id && typeof project.Selected.id != "undefined";
        const currentProjectPage = typeof getProjectDetailsPath[3] == "undefined" ? "dashboard" : getProjectDetailsPath[3];
        return (
            <div class={showLeft ? "flex-row" : ""} id="main-container">
                {showLeft && (
                    <div class="menu-bar flex-col">
                        <div class="site-logo">
                            <img src="/images/cloudcfo-flogo.png" class="img-responsive" />
                        </div>
                        <a id="close-menu" onClick={() => this.showLeft()}>
                            <span class="fa fa-chevron-left text-white" />
                        </a>
                        <Menu
                            pages={_.filter(pages, page => {
                                return page.show_menu == true;
                            })}
                            current_page={currentPage}
                        />
                    </div>
                )}
                <div class="flex-col content-div">
                    <div class={(this.state.miniSideMenu == "true" ? "sidebar-left-mini" : "") + ""} id="wrap">
                        <header class="head shadow-dark-div">
                            <div class="main-bar">
                                <div class={`${showLeft ? "hide" : "toggle-menu"} item`}>
                                    <a onClick={() => this.showLeft()} class="text-white">
                                        <i class="fa fa-bars" aria-hidden="true" />
                                    </a>
                                </div>
                                <div class="title item">{_.isEmpty(currentPage) == false && currentPage.label != "Projects" && <h3 style={{ textTransform: "capitalize", marginTop: 0, marginBottom: 0 }}>{currentPage.label}</h3>}</div>
                                {showProjectMenu && (
                                    <div class="flex-row tab-row mb0 item hidden-sm hidden-xs">
                                        {_.map(projectMenu, (o, index) => {
                                            return (
                                                <div class="flex-col vh-center flex-center" key={index}>
                                                    <Link to={`/projects/${project.Selected.id + o.link}`} class={`${currentProjectPage == o.label.toLowerCase() ? "active" : ""}`}>
                                                        {o.label == "Info" ? (
                                                            <div class="project-image-wrapper">
                                                                <span title={project.Selected.project}>
                                                                    <img src={project.Selected.picture} alt="Profile Picture" class="img-responsive" />
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            o.label
                                                        )}
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div class="action item">
                                    <div class="hidden-sm hidden-xs text-center display-flex action-link">
                                        <a class="mr20" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false" id="notif-bell" onClick={() => this.fetchNotification(1)}>
                                            <span class={`fa fa-bell ${this.props.location.pathname !== "/notification" && notification.NotificationCount > 0 ? "bell-active" : ""}`}> </span>
                                            {notification.NotificationCount > 0 && this.props.location.pathname !== "/notification" && (
                                                <div class="circle" style={{ width: JSON.stringify(notification.NotificationCount).length > 2 ? "auto" : "" }}>
                                                    <p>{notification.NotificationCount || ""}</p>
                                                </div>
                                            )}
                                        </a>
                                        <div class="pull-right dropdown-menu notify-drop" aria-labelledby="notif-bell">
                                            <div class="notif-wrapper">
                                                {notification.List.length > 0 &&
                                                    _.orderBy(notification.List, ["isRead", "dateUpdated"], ["asc", "desc"]).map((e, i) => {
                                                        const { from, dateAdded } = { ...e };
                                                        const duration = moment.duration(moment().diff(moment(dateAdded)));
                                                        const date = duration.asDays() > 1 ? moment(dateAdded).format("MMMM DD, YYYY") : moment(dateAdded).from(new Date());
                                                        return (
                                                            <a href="javascript:void(0)" onClick={() => this.handleNotificationRedirect(e)} key={i}>
                                                                <div class={`display-flex vh-center bb notif-item ${e.isRead ? "" : "n-unread"}`}>
                                                                    <div class="menu-profile">
                                                                        {e.type !== "taskDeadline" && e.type !== "taskTeamDeadline" && e.type !== "taskFollowingDeadline" && e.type !== "taskBeforeDeadline" ? (
                                                                            <img src={e.from.avatar} alt="Profile Picture" class="img-responsive" />
                                                                        ) : (
                                                                            <span class="n-tod-warning">
                                                                                <i class="fa fa-exclamation-circle" />
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div class="ml10 w100">
                                                                        <p class="m0 ">
                                                                            {e.type !== "taskDeadline" && e.type !== "taskTeamDeadline" && e.type !== "taskFollowingDeadline" && e.type !== "taskBeforeDeadline" ? (
                                                                                <span>
                                                                                    {`${from.firstName} ${from.lastName} `}
                                                                                    <strong>{notificationType(e.type)}</strong>
                                                                                </span>
                                                                            ) : (
                                                                                <span>
                                                                                    {`${notificationType(e.type)} `}
                                                                                    <strong>{`Checkout the task ${e.task_notification.task}`}</strong>
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                        <p class="note m0">{date}</p>
                                                                        {e.project_notification && (
                                                                            <p class="m0 td-oblong mt10" style={{ backgroundColor: e.project_notification.color, color: textColor(e.project_notification.color) }}>
                                                                                <span title={e.project_notification.type.type}>
                                                                                    <i class={e.project_notification.type.type == "Client" ? "fa fa-users mr5" : e.project_notification.type.type == "Private" ? "fa fa-lock mr5" : "fa fa-cloud mr5"} />
                                                                                </span>
                                                                                {e.project_notification.project}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </a>
                                                        );
                                                    })}
                                                {notification.Loading == "RETRIEVING" && (
                                                    <p class={`text-center m0 text-orange ${notification.List.length > 0 ? "notif-item n-unread" : ""}`}>
                                                        <i class="fa fa-circle-o-notch fa-spin fa-fw fa-lg m10" />
                                                    </p>
                                                )}
                                                {notification.List.length == 0 && notification.Loading != "RETRIEVING" && (
                                                    <p class="mb0">
                                                        <strong>No Records Found</strong>
                                                    </p>
                                                )}
                                            </div>
                                            <a href={`/account#/notification`}>
                                                <div class="notify-drop-footer text-center">View All Notification</div>
                                            </a>
                                        </div>
                                        {loggedUser.data.userType != "External" && (
                                            <div>
                                                <a class="mr15 btn btn-default btn-orange dropdown-toggle" type="button" id="new" data-toggle="dropdown">
                                                    <span>
                                                        <i class="fa fa-plus mr10" aria-hidden="true" />
                                                        New
                                                    </span>
                                                </a>
                                                <div class="pull-right dropdown-menu new-menu" role="menu" aria-labelledby="new">
                                                    <ul>
                                                        {_.map(dropdownAddLinks, ({ id, label }, index) => {
                                                            return (
                                                                <li role="presentation" key={index}>
                                                                    <a role="menuitem" onClick={() => this.handleAdd(id)}>
                                                                        {label}
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                        <Link to={"/profile"}>
                                            <div class="menu-profile">
                                                <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                            </div>
                                        </Link>
                                    </div>
                                    <div class="dropdown visible-sm visible-xs">
                                        <a class="btn btn-action dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                            <span class="fa fa-ellipsis-v" title="MORE" />
                                        </a>
                                        <div class="dropdown-menu pull-right" aria-labelledby="dropdownMenuButton">
                                            {showProjectMenu &&
                                                _.map(projectMenu, (o, index) => {
                                                    return (
                                                        <li key={index}>
                                                            <Link to={`/projects/${project.Selected.id + o.link}`} class={`${currentProjectPage == o.label.toLowerCase() ? "active" : ""}`}>
                                                                {o.label}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            <li class="bt">
                                                <Link to={"/notification"}>Notification</Link>
                                            </li>
                                            <li>
                                                <Link to={"/profile"}>Profile</Link>
                                            </li>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>
                        <div id="content">
                            <Switch>
                                {_.map(pages, (page, index) => {
                                    return <Route exact={typeof page.exact != "undefined" ? page.exact : false} path={`/${page.path_name}`} component={page.component} key={index} />;
                                })}
                                <Route component={notAvailable} />
                            </Switch>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(Main);
