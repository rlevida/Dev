import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";

import { Loading } from "../../../globalComponents";
import { getData, showToast } from "../../../globalFunction";

@connect(({ members, workstream }) => {
    return {
        members,
        workstream
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { members } = this.props;
        const { Count } = members;

        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }
    }

    fetchData(page) {
        const { workstream, dispatch } = this.props;

        getData(`/api/member?page=${page}&workstreamId=${workstream.Selected.id}`, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_MEMBERS_LIST", list: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_MEMBERS_LOADING", Loading: "" });
            showToast("success", "Members successfully retrieved.");
        });
    }

    getNextResult() {
        const { members } = this.props;
        const { Count } = members;
        this.fetchData(Count.current_page + 1);
    }

    render() {
        const { members } = this.props;
        const currentPage = (typeof members.Count.current_page != "undefined") ? members.Count.current_page : 1;
        const lastPage = (typeof members.Count.last_page != "undefined") ? members.Count.last_page : 1;
        const memberList = members.List;

        return (
            <div class="row pd20">
                <h3 class="m0">Members</h3>
                <table id="dataTable" class="table responsive-table mt30">
                    <tbody>
                        <tr>
                            <th class="text-center">Id</th>
                            <th class="text-left">User Id</th>
                            <th class="text-left">First Name</th>
                            <th class="text-left">Last Name</th>
                            <th class="text-left">Email Address</th>
                            <th class="text-center">Type</th>
                            <th class="text-left">Role/s</th>
                            <th class="text-left">Team/s</th>
                        </tr>

                        {
                            (memberList.length > 0) && _.map(memberList, (data, index) => {
                                return (
                                    <tr key={index}>
                                        <td class="text-center">{data.id}</td>
                                        <td class="text-left">{data.user.username}</td>
                                        <td class="text-left">{data.user.firstName}</td>
                                        <td class="text-left">{data.user.lastName}</td>
                                        <td class="text-left">{data.user.emailAddress}</td>
                                        <td class="text-center">{data.user.userType}</td>
                                        <td class="text-left">
                                            {
                                                `${_.map(data.user.user_role, ({ role }) => { return role.role }).join("\r\n")}`
                                            }
                                        </td>
                                        <td class="text-left">
                                            {
                                                `${_.map(data.user.users_team, ({ team }) => { return team.team }).join("\r\n")}`
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
                        (members.Loading == "RETRIEVING") && <Loading />
                    }
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Task</a>
                    }
                    {
                        (memberList.length == 0 && members.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}