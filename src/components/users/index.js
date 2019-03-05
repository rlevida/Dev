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

    handleAddTeam() {
        $(`#teamsModal`).modal('show');
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