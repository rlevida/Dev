import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData, showToast } from '../../globalFunction';

@connect((store) => {
    return {
        workstream: store.workstream,
        members: store.members
    }
})
export default class WorkstreamMembers extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "getList",
            "getNext"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_MEMBERS_LIST", list: [], count: {} });
        dispatch({ type: "SET_MEMBERS_LOADING", Loading: "RETRIEVING" });
    }
    componentDidMount() {
        const { members } = this.props;
        if (_.isEmpty(members.Count)) {
            this.getList(1);
        }
    }
    getList(page) {
        const { workstream_id, dispatch } = this.props;

        getData(`/api/member?page=${page}&workstreamId=${workstream_id}&isDeleted=0`, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_MEMBERS_LIST", list: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_MEMBERS_LOADING", Loading: "" });
            showToast("success", "Workstream members successfully retrieved.");
        });
    }
    getNext() {
        const { members } = this.props;
        const { Count } = members;
        this.getList(Count.current_page + 1);
    }
    render() {
        const { members } = { ...this.props };
        const { Loading, Count } = members;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;

        return (
            <div class="mt20">
                <div class={(Loading == "RETRIEVING") ? "linear-background" : ""}>
                    {
                        (members.List.length > 0) && <table>
                            <thead>
                                <tr>
                                    <th scope="col">Username</th>
                                    <th scope="col">First Name</th>
                                    <th scope="col">Last Name</th>
                                    <th scope="col">Email Address</th>
                                    <th scope="col">Member Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.orderBy(members.List, ['firstName'], ['asc']).map(({ user, memberType }, index) => {

                                        return (
                                            <tr
                                                key={index}
                                            >
                                                <td data-label="Username">
                                                    <div class="profile-div">
                                                        <div class="thumbnail-profile">
                                                            <img src={user.avatar} alt="Profile Picture" class="img-responsive" />
                                                        </div>
                                                        <p class="m0">{user.username}</p>
                                                    </div>
                                                </td>
                                                <td data-label="First Name">
                                                    {user.firstName}
                                                </td>
                                                <td data-label="Last Name">
                                                    {user.lastName}
                                                </td>
                                                <td data-label="Email Address">
                                                    {user.emailAddress}
                                                </td>
                                                <td data-label="Member Type">
                                                    {
                                                        (memberType != "responsible") ? "Assigned to Task" : "Workstream Responsible"
                                                    }
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    }
                    {
                        (currentPage != lastPage && Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Members</a></p>
                    }
                    {
                        (members.List.length == 0 && Loading != "RETRIEVING") && <p class="text-center"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        )
    }
}