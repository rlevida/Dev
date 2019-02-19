import React from "react";
import { connect } from "react-redux";

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

    render() {
        const { users, dispatch } = this.props;
        return (
            <div>
                {
                    users.FormActive == "List" && <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="mb20 bd">
                                    <div class="container-fluid filter mb20">
                                        <div class="row content-row">
                                            <div class="col-md-12 col-sm-12">
                                                <div class="add-action">
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
                                Create New User
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