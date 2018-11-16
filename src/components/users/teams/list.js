import React from "react";
import Tooltip from "react-tooltip";
import { connect } from "react-redux";

import TeamModal from "./teamModal";

@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser,
        users: store.users
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.renderArrayTd = this.renderArrayTd.bind(this)
    }

    componentWillMount() {
        let { teams } = { ...this.props };
        this.props.socket.emit("GET_TEAM_LIST", {});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_TEAM_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_TEAM", { data: { id: id, isActive: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_TEAM", { id: id })
        }
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }
    render() {
        let { teams, socket, loggedUser, users } = this.props;
        let teamList = _.filter(teams.List, (o) => {

            if (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) {
                return o.id > 0
            } else if (loggedUser.data.userRole == 3) {
                let loggedTeam = JSON.parse(loggedUser.data.team);
                return (o.teamLeaderId == loggedUser.data.id || o.usersId == loggedUser.data.id) || (_.filter(loggedTeam, (lt) => { return lt.value == o.id })).length > 0;
            }
        });

        return (
            <div>
                <table id="dataTable" class="table responsive-table m0">
                    <tbody>
                        <tr>
                            <th class="text-center">Id</th>
                            <th class="text-left">Team</th>
                            <th class="text-left">Team Leader</th>
                            <th class="text-left">Members</th>
                            <th class="text-center"></th>
                        </tr>
                        {
                            (teamList.length == 0) &&
                            <tr>
                                <td style={{ textAlign: "center" }} colSpan={5}>No Record Found!</td>
                            </tr>
                        }
                        {
                            teamList.map((data, index) => {
                                let teamMembers = _(users.List).
                                    filter((user) => {
                                        return _.findIndex(user.team, (o) => { return o.teamId == data.id }) >= 0;
                                    })
                                    .value();
                                return (
                                    <tr key={index}>
                                        <td class="text-center">{data.id}</td>
                                        <td class="text-left">{data.team}</td>
                                        <td class="text-left">{data.users_username}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(teamMembers, (el) => { return el.username }))}</td>
                                        <td class="text-center">
                                            {
                                                (
                                                    (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2)
                                                    ||
                                                    (loggedUser.data.id == data.usersId)
                                                    ||
                                                    (loggedUser.data.id == data.teamLeaderId)
                                                ) && <div>
                                                    <a href="javascript:void(0);" data-tip="EDIT"
                                                        onClick={(e) => socket.emit("GET_TEAM_DETAIL", { id: data.id })}
                                                        class="btn btn-info btn-sm">
                                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                                    <a href="javascript:void(0);" data-tip="DELETE"
                                                        onClick={e => this.deleteData(data.id)}
                                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                        <span class="glyphicon glyphicon-trash"></span></a>
                                                    <Tooltip />
                                                </div>
                                            }
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                <TeamModal />
            </div>
        )
    }
}