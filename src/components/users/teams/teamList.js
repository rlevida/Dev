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
        teams: store.teams,
        settings: store.settings
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
        if (value.teamProjects.length > 0) {
            showToast('error', 'The team is assigned to a project. Remove the assignment first before deleting this record.');
        } else {
            dispatch({ type: "SET_TEAM_SELECTED", Selected: { ...value, action: 'delete' } })
            $("#delete-team").modal("show");
        }
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
        let fetchUrl = `/api/teams?page=${page}`;

        if (loggedUser.data.userRole > 3) {
            fetchUrl += `&userId=${loggedUser.data.id}`
        }

        getData(fetchUrl, {}, (c) => {
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
        dispatch({ type: "SET_TEAM_SELECTED", Selected: { ...data, users_team: data.users_team.map((e) => { return { value: e.user.id, label: `${e.user.firstName} ${e.user.lastName}`, image: e.user.avatar } }) } });
        dispatch({ type: "SET_TEAM_FORM_ACTIVE", FormActive: "Form" });
    }

    render() {
        const { teams, loggedUser, settings } = { ...this.props };
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
                                <th scope="col">Projects</th>
                                <th scope="col">Workstreams</th>
                                <th scope="col" class={(loggedUser.data.userRole >= 4) ? "hide" : "actions"}>Actions</th>
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
                                                <div class="display-flex">
                                                    {
                                                        _.map(_.take(team.users_team, 2), (o, index) => {
                                                            const { firstName, lastName, avatar } = o.user;
                                                            return (
                                                                <div class="thumbnail-profile" key={index}>
                                                                    <span title={firstName + " " + lastName}>
                                                                        <img
                                                                            src={`${settings.site_url}api/file/profile_pictures/${avatar}`}
                                                                            alt="Profile Picture" class="img-responsive" />
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                    {
                                                        ((team.users_team).length > 2) && <span
                                                            class="thumbnail-count"
                                                            title={
                                                                _(team.users_team)
                                                                    .filter((o, index) => { return index > 1 })
                                                                    .map((o) => {
                                                                        const { firstName, lastName, avatar } = o.user;
                                                                        return firstName + " " + lastName
                                                                    })
                                                                    .value()
                                                                    .join("\r\n")
                                                            }
                                                        >
                                                            +{(team.users_team).length - 2}
                                                        </span>
                                                    }
                                                </div>
                                            </td>
                                            <td data-label="Projects">
                                                {
                                                    ((team.teamProjects).length > 0) && <div>
                                                        {this.renderArrayTd(_.map(team.teamProjects, ({ memberProject }) => { return memberProject.project }))}
                                                    </div>
                                                }
                                            </td>
                                            <td data-label="Workstreams">
                                                {
                                                    ((_.flatten(_.map(team.teamProjects, (o) => { return o.memberProject.workstream }))).length > 0) && <div>
                                                        {
                                                            (_.flatten(_.map(team.teamProjects, (o) => { return o.memberProject.workstream }))).length
                                                        }
                                                    </div>
                                                }
                                            </td>
                                            <td data-label="Actions" class={(loggedUser.data.userRole >= 4) ? "hide" : "actions"}>
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