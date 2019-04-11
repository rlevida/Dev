import React from "react";
import { connect } from "react-redux";

import TeamList from "./teamList";
import TeamForm from "./teamForm";

@connect((store) => {
    return {
        teams: store.teams,
        users: store.users,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: 'SET_TEAM_LIST', list: [], Count: {} });
    }

    render() {
        const { teams, users, dispatch, loggedUser } = this.props;

        return (
            <div>
                {
                    (teams.FormActive == "List") && <div class="row">
                        <div class="col-md-12">
                            <div class="card">
                                <div class="mb20 bb">
                                    <div class="container-fluid filter mb20">
                                        <div class="row content-row">
                                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                                <div class="flex-row tab-row mb0">
                                                    <div class="flex-col">
                                                        <a
                                                            class={`btn btn-default ${(users.FormActive == "List") ? "btn-active" : ""}`}
                                                            onClick={() => {
                                                                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
                                                                dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "" });
                                                            }}
                                                        >
                                                            Users
                                                        </a>
                                                    </div>
                                                    <div class="flex-col">
                                                        <a class={`btn btn-default ${(teams.FormActive == "List") ? "btn-active" : ""}`}>
                                                            Teams
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                            {
                                                (loggedUser.data.userRole < 4) &&
                                                <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                                    <div class="button-action">
                                                        <a class="btn btn-default" onClick={() => {
                                                            dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "Form" })
                                                            dispatch({ type: "SET_TEAM_SELECTED", Selected: "" })
                                                        }
                                                        }>
                                                            <span><i class="fa fa-plus mr10" aria-hidden="true"></i></span>
                                                            Add New Team
                                                        </a>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div class={(users.Loading == "RETRIEVING" && (users.List).length == 0) ? "linear-background" : ""}>
                                    <TeamList />
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {
                    (teams.FormActive == "Form") && <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New Team
                            </h4>
                        </div>
                        <div class="card-body">
                            <TeamForm />
                        </div>
                    </div>
                }
            </div>
        )
    }
}