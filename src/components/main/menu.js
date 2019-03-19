import React from "react";
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import _ from "lodash";
import { withRouter } from 'react-router'

import { showToast, deleteData, getData } from '../../globalFunction';

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        project: store.project
    }
})
class Component extends React.Component {
    constructor(props) {
        super(props)
        this.handleLogout = this.handleLogout.bind(this)
    }

    handleLogout() {
        const { loggedUser, dispatch } = this.props;
        deleteData(`/api/login/${loggedUser.data.id}`, {}, (c) => {
            setTimeout(function () {
                window.location.replace('/');
            }, 1000);
            dispatch({
                type: "SET_LOGGED_USER_DATA", data: {
                    username: "",
                    emailAddress: "",
                    userType: ""
                }
            })
            showToast("success", 'Successfully logout.');
        })
    }

    componentDidUpdate() {
        const { dispatch, project } = { ...this.props };
        if (typeof project.Selected.id && project.Category.Active === "") {
            let category = []

            if (project.Category.Client.length) {
                category = _.filter(project.Category.Client, (e) => { return e.id === parseInt(project.Selected.id) })
            }
            if (project.Category.Internal.length) {
                category = _.filter(project.Category.Internal, (e) => { return e.id === parseInt(project.Selected.id) })
            }
            if (project.Category.Private.length) {
                category = _.filter(project.Category.Private, (e) => { return e.id === parseInt(project.Selected.id) })
            }

            if (category.length) {
                dispatch({ type: "SET_ACTIVE_CATEGORY", ActiveCategory: category[0].type.type })
            }

        }
    }

    componentDidMount() {
        const { dispatch } = this.props;

        // if (typeof project != "undefined" && project) {
        //     getData(`/api/project/detail/${project}`, {}, (c) => {
        //         dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data })
        //     })
        // }

        getData(`/api/project?typeId=1`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_CATEGORY", list: c.data.result, category: "Client" })
        })
        getData(`/api/project?typeId=2`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_CATEGORY", list: c.data.result, category: "Internal" })
        })
        getData(`/api/project?typeId=3`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_CATEGORY", list: c.data.result, category: "Private" })
        })
    }

    onClick(e, category) {
        const { dispatch, history } = { ...this.props };
        dispatch({ type: "SET_ACTIVE_CATEGORY", ActiveCategory: category })
        history.push(`/projects/${e.id}`)
    }

    render() {
        const { pages, current_page = "", project } = { ...this.props };
        return (
            <div>
                <ul id="menu">
                    {
                        _.map(pages, (page, index) => {
                            return (
                                <li key={index}
                                    class={
                                        `
                                        ${(current_page != "" && current_page.label == page.label) ? 'active' : ''} 
                                        ${page.path_name == "projects" ? 'mt20' : ''}
                                        `
                                    }>
                                    <Link to={`/${page.path_name}`} class="menu-list">
                                        <i class={`fa mr10 ${page.icon}`} aria-hidden="true"></i>
                                        <span class="link-title">{page.label}</span>
                                    </Link>
                                </li>
                            )
                        })
                    }
                </ul>
                <div class="dropdown project-menu-category">
                    <ul id="menu" class={project.Category.Active === "Client" ? "open" : ""}>
                        <li class="dropdown-toggle" type="button" data-toggle="dropdown">
                            <a><i class="fa fa-caret-right mr20"></i>Client</a>
                        </li>
                        <ul class="dropdown-menu ml20">
                            {
                                _.map(project.Category.Client, (e, i) => {
                                    return (
                                        <li key={i}>
                                            <a onClick={() => this.onClick(e, 'Client')}>
                                                <span><i class="fa fa-square mr10" style={{ color: e.color }}></i></span>
                                                {e.project}
                                            </a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </ul>
                </div>
                <div class="dropdown project-menu-category">
                    <ul id="menu" class={project.Category.Active === "Internal" ? "open" : ""}>
                        <li class="dropdown-toggle" type="button" data-toggle="dropdown">
                            <a><i class="fa fa-caret-right mr20"></i>Internal</a>
                        </li>
                        <ul class="dropdown-menu ml20">
                            {
                                _.map(project.Category.Internal, (e, i) => {
                                    return (
                                        <li key={i}>
                                            <a onClick={() => this.onClick(e, 'Internal')}>
                                                <span><i class="fa fa-square mr10" style={{ color: e.color }}></i></span>
                                                {e.project}
                                            </a>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </ul>
                </div>
                <div class="dropdown project-menu-category">
                    <ul id="menu">
                        <li class="dropdown-toggle" type="button" data-toggle="dropdown">
                            <a><i class="fa fa-caret-right mr20"></i>Private</a>
                        </li>
                        <ul class="dropdown-menu ml20">
                            {
                                _.map(project.Category.Private, (e, i) => {
                                    return (
                                        <li key={i}>
                                            <Link to={`/projects/${e.id}`}>
                                                <span><i class="fa fa-square mr10" style={{ color: e.color }}></i></span>
                                                {e.project}
                                            </Link>
                                        </li>
                                    )
                                })
                            }
                        </ul>
                    </ul>
                </div>
            </div>
        );
    }
}


export default withRouter(Component)