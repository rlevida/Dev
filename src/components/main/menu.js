import React from "react";
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import _ from "lodash";

import { showToast, deleteData, getData } from '../../globalFunction';

@connect((store) => {
    return {
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
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

    componentDidMount() {
        const { dispatch } = this.props;

        if (typeof project != "undefined" && project) {
            getData(`/api/project/detail/${project}`, {}, (c) => {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data })
            })
        }
    }

    render() {
        const { pages, current_page = "" } = { ...this.props };
        return (
            <ul id="menu">
                {
                    _.map(pages, (page, index) => {
                        return (
                            <li key={index} class={(current_page != "" && current_page.label == page.label) ? 'active' : ''}>
                                <Link to={`/${page.path_name}`} class="menu-list">
                                    <i class={`fa mr10 ${page.icon}`} aria-hidden="true"></i>
                                    <span class="link-title">{page.label}</span>
                                </Link>
                            </li>
                        )
                    })
                }
            </ul>
        );
    }
}
