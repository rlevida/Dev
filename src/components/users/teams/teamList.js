import React from "react";
import _ from "lodash";
import { connect } from "react-redux";

import { Loading, DeleteModal } from "../../../globalComponents";
import { showToast, getData, putData } from '../../../globalFunction';

@connect((store) => {
    return {
        teams: store.teams,
        loggedUser: store.loggedUser,
        users: store.users,
        teams: store.teams
    }
})
export default class TeamList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            'confirmDelete',
            'deleteData',
            'editData',
            'getList',
            'renderArrayTd'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { teams } = this.props;

        if (_.isEmpty(teams.Count)) {
            this.getList(1);
        }
    }

    deleteData(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TEAM_SELECTED", Selected: { ...value, action: 'delete' } })
        $("#delete-team").modal("show");
    }

    confirmDelete() {
        const { teams, dispatch } = { ...this.props };
        const { id } = teams.Selected

        putData(`/api/teams/deleteTeam/${id}`, { isDeleted: 1 }, (c) => {
            dispatch({ type: 'REMOVE_DELETED_TEAM_LIST', id: id });
            dispatch({ type: 'UPDATE_USER_TEAM', List: c.data });
            showToast('success', 'Team successfully deleted.');
            $("#delete-team").modal("hide");
        });
    }

    getList(page) {
        const { dispatch, teams, loggedUser } = this.props;
        
        getData(`/api/teams?page=${page}&isDeleted=0&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}`, {}, (c) => {
            dispatch({ type: 'SET_TEAM_LIST', list: teams.List.concat(c.data.result), Count: c.data.count });
            dispatch({ type: 'SET_TEAM_LOADING', Loading: '' });
        });
    }

    getNext() {
        const { teams, dispatch } = this.props;
        dispatch({ type: "SET_TEAM_LOADING", Loading: "RETRIEVING" });
        this.getList(teams.Count.current_page + 1);
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    editData(data) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TEAM_SELECTED", Selected: { ...data, users_team: data.users_team.map((e) => { return { value: e.user.id, label: `${e.user.firstName} ${e.user.lastName}` } }) } });
        dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "Form" });
    }

    render() {
        let { teams } = this.props;
        const currentPage = (typeof teams.Count.current_page != "undefined") ? teams.Count.current_page : 1;
        const lastPage = (typeof teams.Count.last_page != "undefined") ? teams.Count.last_page : 1;
        const typeValue = (typeof teams.Selected.team != "undefined" && _.isEmpty(teams.Selected) == false) ? teams.Selected.team : "";
        const teamList = teams.List;

        return (
            <div>
                {
                    ((teamList).length > 0) &&
                    <table id="team-list">
                        <thead>
                            <tr>
                                <th scope="col">Team ID</th>
                                <th scope="col">Team Name</th>
                                <th scope="col">Team Leader</th>
                                <th scope="col">Members</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                _.map(teamList, (team, index) => {

                                    return (
                                        <tr key={index}>
                                            <td data-label="Team ID">
                                                {team.id}
                                            </td>
                                            <td data-label="Team Name">
                                                {team.team}
                                            </td>
                                            <td data-label="Team Leader">
                                                {team.teamLeader.firstName + " " + team.teamLeader.lastName}
                                            </td>
                                            <td data-label="Members">
                                                {this.renderArrayTd(_.map(team.users_team, (o) => { return o.user.firstName + " " + o.user.lastName }))}
                                            </td>
                                            <td data-label="Actions">
                                                <a href="javascript:void(0);"
                                                    onClick={() => this.editData(team)}
                                                    class="btn btn-action">
                                                    <span class="glyphicon glyphicon-pencil" title="EDIT"></span>
                                                </a>
                                                <a href="javascript:void(0);" data-tip="DELETE"
                                                    onClick={e => this.deleteData(team)}
                                                    class="btn btn-action">
                                                    <span class="glyphicon glyphicon-trash"></span>
                                                </a>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                }
                {
                    (teamList.length == 0 && teams.Loading != "RETRIEVING") && <p class="mb0 mt10 text-center"><strong>No Records Found</strong></p>
                }
                {
                    (teams.Loading == "RETRIEVING" && (teams.List).length > 0) && <Loading />
                }
                {
                    (_.isEmpty(teams) == false && (currentPage != lastPage) && teams.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Teams</a></p>
                }
                {/* Modals */}
                <DeleteModal
                    id="delete-team"
                    type={'team'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
            </div>
        )
    }
}