import React from "react";
import Tooltip from "react-tooltip";
import { connect } from "react-redux";

import { DropDown, Loading } from "../../../globalComponents";
import { showToast, getData, deleteData, putData } from '../../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser,
        users: store.users,
        teams: store.teams
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.renderArrayTd = this.renderArrayTd.bind(this)
        this.fetchData = this.fetchData.bind(this)
        this.handleEdit = this.handleEdit.bind(this)
    }

    componentDidMount() {
        const { teams } = this.props;
        this.fetchData(1)
    }

    deleteData(id) {
        const { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/teams/deleteTeam/${id}`, { isDeleted: 1 }, (c) => {
                dispatch({ type: 'REMOVE_DELETED_TEAM_LIST', id: id })
                dispatch({ type: 'UPDATE_USER_TEAM', List: c.data })
                showToast('success', 'Successfully Deleted.');
            })
        }
    }

    fetchData(page) {
        const { dispatch, loggedUser, teams } = this.props;
        getData(`/api/teams?page=${page}&isDeleted=0`, {}, (c) => {
            dispatch({ type: 'SET_TEAM_LIST', list: teams.List.concat(c.data.result), Count: c.data.count });
            dispatch({ type: 'SET_TEAM_LOADING', Loading: '' });
        })
    }

    getNextResult() {
        const { teams } = this.props;
        this.fetchData(teams.Count.current_page + 1)
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_TEAM_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_TEAM", { data: { id: id, isActive: (active == 1) ? 0 : 1 } })
    }

    renderArrayTd(arr) {
        return (
            arr.join(", ")
        );
    }

    handleEdit(data) {
        const { dispatch } = this.props;
        $(`#teamsModal`).modal('show');
        dispatch({ type: "SET_TEAM_SELECTED", Selected: { ...data, users_team: data.users_team.map((e) => { return { value: e.user.id, label: `${e.user.firstName} ${e.user.lastName}` } }) } })
        dispatch({ type: "SET_TEAM_CURRENT_DATA_SELECTED", Selected: { ...data, users_team: data.users_team.map((e) => { return { value: e.user.id, label: `${e.user.firstName} ${e.user.lastName}` } }) } })
    }

    render() {
        let { teams, loggedUser } = this.props;
        const currentPage = (typeof teams.Count.current_page != "undefined") ? teams.Count.current_page : 1;
        const lastPage = (typeof teams.Count.last_page != "undefined") ? teams.Count.last_page : 1;

        let teamList = _.filter(teams.List, (o) => {
            if (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) {
                return o.id > 0
            } else if (loggedUser.data.userRole == 3) {
                return (o.teamLeaderId == loggedUser.data.id || o.usersId == loggedUser.data.id) || (_.filter(o.users_team, (lt) => { return lt.usersId == loggedUser.data.id })).length > 0;
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
                            teamList.map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td class="text-center">{data.id}</td>
                                        <td class="text-left">{data.team}</td>
                                        <td class="text-left">{`${data.teamLeader.firstName} ${data.teamLeader.lastName}`}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(data.users_team, (el) => { return el.user.username }))}</td>
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
                                                        onClick={(e) => this.handleEdit(data)}
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
                <div class="text-center">
                    {
                        ((currentPage != lastPage) && teamList.length > 0 && teams.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Teams</a>
                    }
                    {
                        (teamList.List == 0 && teams.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (teams.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}