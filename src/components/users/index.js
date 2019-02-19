import React from "react";
import { connect } from "react-redux";

import { getData } from "../../globalFunction"
import Header from "../partial/header"
import Users from "./users"
import Team from "./teams"
import TeamsModal from './teams/teamsModal'

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

        // getData(`/api/globalORM/selectList?selectName=usersList`, {}, (c) => {
        //     dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'usersList' })
        // })




        // getData(`/api/globalORM/selectList?selectName=teamList`, {}, (c) => {
        //     dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'teamList' })
        // })

        // getData(`/api/globalORM/selectList?selectName=projectList`, {}, (c) => {
        //     dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectList' })
        // })
    }

    handleAddTeam() {
        $(`#teamsModal`).modal('show');
    }

    render() {
        const Component = <Users />
        return (
            <Header component={Component} page={"Teams & Users"} />
        )
    }
}