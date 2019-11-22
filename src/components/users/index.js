import React from "react";
import { connect } from "react-redux";

import { getData } from "../../globalFunction"
import Users from "./users"
import Teams from "./teams"

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        teams: store.teams,
        users: store.users,
        project: store.project
    }
})
export default class Component extends React.Component {

    componentDidMount() {
        const { dispatch } = this.props;

        getData(`/api/globalORM/selectList?selectName=roleList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'roleList' })
        });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;

        dispatch({ type: 'SET_USER_LOADING', Loading: 'RETRIEVING' });
        dispatch({ type: "SET_USER_LIST", list: [] });
        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });

        dispatch({ type: 'SET_TEAM_LIST', list: [] });
        dispatch({ type: 'SET_TEAM_LOADING', Loading: 'RETRIEVING' });
        dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "" });

        dispatch({ type: 'SET_USER_SELECTED', Selected: "" });
        dispatch({ type: "SET_USER_FILTER", filter: { name: "" } });
        window.stop();
    }
    render() {
        return (
            <div>
                <Users />
                <Teams />
            </div>
        )
    }
}