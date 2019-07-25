import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import _ from "lodash";
import { withRouter } from "react-router";

import { showToast, deleteData, getData } from "../../globalFunction";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        project: store.project
    };
})
class Component extends React.Component {
    constructor(props) {
        super(props);

        _.map(["handleLogout", "handleFetchProjectCategory"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }
    handleLogout() {
        const { loggedUser } = this.props;
        deleteData(`/api/login/${loggedUser.data.id}`, {}, c => {
            setTimeout(function() {
                window.location.replace("/");
            }, 1000);
            showToast("success", "Successfully logout.");
        });
    }
    componentDidUpdate() {
        const { dispatch, project } = { ...this.props };
        if (typeof project.Selected.id && project.Category.Active === "") {
            let category = [];

            if (project.Category.Client.list.length) {
                category = _.filter(project.Category.Client.list, e => {
                    return e.id === parseInt(project.Selected.id);
                });
                if (category.length) {
                    dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: category[0].type.type });
                }
            }
            if (project.Category.Internal.list.length) {
                category = _.filter(project.Category.Internal.list, e => {
                    return e.id === parseInt(project.Selected.id);
                });
                if (category.length) {
                    dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: category[0].type.type });
                }
            }
            if (project.Category.Private.list.length) {
                category = _.filter(project.Category.Private.list, e => {
                    return e.id === parseInt(project.Selected.id);
                });
                if (category.length) {
                    dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: category[0].type.type });
                }
            }
        }
    }
    componentDidMount() {
        $(document).on("click", ".dropdown-menu-wrapper", function(e) {
            if ($(this).hasClass("keep-open-on-click")) {
                e.stopPropagation();
            }
        });
    }
    onClick(e, category) {
        const { dispatch, history } = { ...this.props };

        if (history.location.pathname !== `/projects/${e.id}`) {
            history.push(`/projects/${e.id}`);
            dispatch({ type: "SET_PROJECT_ACTIVE_CATEGORY", ActiveCategory: category });
        }
    }
    handleFetchProjectCategory({ category, page, initialLoad }) {
        const { loggedUser, dispatch, project } = { ...this.props };

        if ((initialLoad && project.Category[category].list.length === 0) || !initialLoad) {
            const requestUrl = `/api/project?userId=${loggedUser.data.id}&updateCount=false&userRole=${loggedUser.data.userRole}`;
            let typeId = 0;
            if (category === "Client") {
                typeId = 1;
            } else if (category === "Internal") {
                typeId = 2;
            } else if (category === "Private") {
                typeId = 3;
            }
            dispatch({ type: "SET_PROJECT_CATEGORY", data: { ...project.Category[category], loading: "RETRIEVING" }, category: category });
            getData(`${requestUrl}&typeId=${typeId}&page=${page}&projectStatus=Active`, {}, c => {
                dispatch({ type: "SET_PROJECT_CATEGORY", data: { list: [...project.Category[category].list, ...c.data.result], count: c.data.count, loading: "" }, category: category });
            });
        }
    }
    render() {
        const { pages, current_page = "", project, loggedUser } = { ...this.props };
        return (
            <div>
                <ul id="menu">
                    {_.map(pages, (page, index) => {
                        return (
                            <li
                                key={index}
                                class={`
                                        ${current_page != "" && current_page.label == page.label ? "active" : ""} 
                                        ${page.path_name == "projects" ? "" : ""}
                                        `}
                            >
                                <Link to={`/${page.path_name}`} class={`menu-list ${page.path_name == "projects" && (loggedUser.data.userRole > 4 && loggedUser.data.projectId.length == 1) ? "un-clickable" : ""}`}>
                                    <i class={`fa mr10 ${page.icon}`} aria-hidden="true" />
                                    <span class="link-title">{page.label}</span>
                                </Link>
                                {page.path_name == "projects" && (
                                    <div class="hidden-xs">
                                        {_.map(["Client", "Internal", "Private"], (o, index) => {
                                            const currentPage = typeof project.Category[o].count.current_page != "undefined" ? project.Category[o].count.current_page : 1;
                                            const lastPage = typeof project.Category[o].count.last_page != "undefined" ? project.Category[o].count.last_page : 1;
                                            return (
                                                <div key={index}>
                                                    <div class="dropdown project-menu-category">
                                                        <ul class="dropdown-menu-wrapper keep-open-on-click">
                                                            <li class="dropdown-toggle" type="button" data-toggle="dropdown">
                                                                <a href="javascript:void(0)" onClick={() => this.handleFetchProjectCategory({ category: o, page: 1, initialLoad: true })}>
                                                                    <i class="fa fa-caret-right mr20" />
                                                                    {o}
                                                                </a>
                                                            </li>
                                                            <ul class="dropdown-menu ml20 mb0">
                                                                {_.map(project.Category[o].list, (e, i) => {
                                                                    return (
                                                                        <li key={i} class={project.Selected.id && e.id === parseInt(project.Selected.id) ? "active" : ""}>
                                                                            <a href="javascript:void(0)" onClick={() => this.onClick(e, o)} class="ml50">
                                                                                <span>
                                                                                    <i class="fa fa-square mr10" style={{ color: e.color }} />
                                                                                </span>
                                                                                {e.project}
                                                                            </a>
                                                                        </li>
                                                                    );
                                                                })}
                                                                {currentPage != lastPage && project.Category[o].loading == "" && (
                                                                    <li>
                                                                        <a
                                                                            href="javascript:void(0)"
                                                                            class="ml50 pdl5 notes"
                                                                            onClick={e => {
                                                                                this.handleFetchProjectCategory({
                                                                                    category: o,
                                                                                    page: currentPage + 1,
                                                                                    initialLoad: false
                                                                                });
                                                                                e.stopPropagation();
                                                                            }}
                                                                        >
                                                                            Load More
                                                                        </a>
                                                                    </li>
                                                                )}
                                                                {project.Category[o].loading == "RETRIEVING" && (
                                                                    <p class="text-center m0 text-white">
                                                                        <i class="fa fa-circle-o-notch fa-spin fa-fw" />
                                                                    </p>
                                                                )}
                                                            </ul>
                                                        </ul>
                                                    </div>
                                                    {/* )} */}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                    <li>
                        <a class="menu-list" onClick={this.handleLogout}>
                            <i class="fa mr10 fa-power-off" aria-hidden="true" />
                            <span class="link-title">Logout</span>
                        </a>
                    </li>
                </ul>
            </div>
        );
    }
}

export default withRouter(Component);
