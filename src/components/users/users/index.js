import React from "react";
import { connect } from "react-redux";
import { getData, showToast } from '../../../globalFunction';

import UserList from "./userList";
import UserForm from "./userForm";

@connect((store) => {
    return {
        users: store.users,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { dispatch } = this.props;
        getData(`/api/user?page=1&isDeleted=0`, {}, (c) => {
            dispatch({ type: 'SET_USER_LIST', list: c.data.result, Count: c.data.count });
            dispatch({ type: 'SET_USER_LOADING', Loading: '' });
            showToast("success", "Users successfully retrieved.");
        });
    }

    render() {
        const { users, dispatch } = this.props;
        return (
            <div>
                {
                    (users.FormActive == "List") && <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="mb20 bb">
                                    <div class="container-fluid filter mb20">
                                        <div class="row content-row">
                                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                                <div class="flex-row tab-row mb0">
                                                    <div class="flex-col">
                                                        <a class={`btn btn-default ${(users.FormActive == "List") ? "btn-active" : ""}`}>Users</a>
                                                    </div>
                                                    <div class="flex-col">
                                                        <a
                                                            class="btn btn-default"
                                                            onClick={() => {
                                                                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "" });
                                                                dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                                                            }}
                                                        >
                                                            Teams
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                                <div class="button-action">
                                                    <a class="btn btn-default" onClick={() => {
                                                        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" })
                                                        dispatch({ type: "SET_USER_SELECTED", Selected: "" })
                                                    }
                                                    }>
                                                        <span><i class="fa fa-plus mr10" aria-hidden="true"></i></span>
                                                        Add New User
                                                </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class={(users.Loading == "RETRIEVING" && (users.List).length == 0) ? "linear-background" : ""}>
                                    <UserList />
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {
                    users.FormActive == "Form" && <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New User
                            </h4>
                        </div>
                        <div class="card-body">
                            <UserForm />
                        </div>
                    </div>
                }
            </div>
        )
    }
}