import React from "react"
import ReactDOM from "react-dom"
import { getData } from "../../globalFunction"
import Header from "../partial/header"
import User from "./users"
import Team from "./teams"

import UsersModal from './users/usersModal'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        teams: store.teams,
        users: store.users,
        project: store.project
    }
})
export default class Component extends React.Component {

    componentDidMount() {
        const { dispatch } = this.props;
        getData(`/api/globalORM/selectList?selectName=usersList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'usersList' })
        })

        getData(`/api/globalORM/selectList?selectName=roleList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'roleList' })
        })

        getData(`/api/globalORM/selectList?selectName=teamList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'teamList' })
        })
    }

    handleAddTeam() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "Form" })
    }
    handleAddUser() {
        $(`#usersModal`).modal('show');
        // dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" })
    }
    render() {
        let { dispatch, teams, users, project, loggedUser } = this.props;
        let projectList = _.filter(project.List, (o) => {
            return o.projectManagerId == loggedUser.data.id
        });
        let Component = <div>
            {
                (users.FormActive != 'ChangePassword' && users.FormActive != "Form") && <div class="row pdl20 pdr20 mb20">
                    <div class="col-md-12">
                        <h4 class="mt20 mb20">Team</h4>
                        <a class="more" onClick={(e) => this.handleAddTeam()} >Add Team</a>
                        <Team />
                    </div>
                </div>
            }
            {
                (teams.FormActive != "Form") && <div class="row pdl20 pdr20 mb20">
                    <div class="col-md-12">
                        <h4 class="mt20 mb20">Users</h4>
                        {
                            ((loggedUser.data.userType == "External" && projectList.length > 0) || loggedUser.data.userType == "Internal") && <a class="more" onClick={(e) => this.handleAddUser()} >Add User</a>
                        }
                        <User />
                        <UsersModal />
                    </div>
                </div>
            }

        </div>
        return (
            <Header component={Component} page={"Teams"} />
        )
    }
}