import React from "react"
import ReactDOM from "react-dom"
import { getData } from "../../globalFunction"
import Header from "../partial/header"
import User from "./users"
import Team from "./teams"

import TeamsModal from './teams/teamsModal'
import UsersModal from './users/usersModal'
import ChangePasswordModal from './users/changePasswordModal'

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

        getData(`/api/globalORM/selectList?selectName=projectList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectList' })
        })
    }

    handleAddTeam() {
        $(`#teamsModal`).modal('show');
    }
    handleAddUser() {
        $(`#usersModal`).modal('show');
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
                        <TeamsModal />
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
                        <ChangePasswordModal />
                    </div>
                </div>
            }

        </div>
        return (
            <Header component={Component} page={"Teams"} />
        )
    }
}