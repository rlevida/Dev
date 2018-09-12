import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment';
import _ from 'lodash';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        users: store.users,
        global: store.global
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.renderArrayTd = this.renderArrayTd.bind(this);

    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    render() {
        let { workstream, global, users } = this.props;

        let userMemberList = _(workstream.Selected.taskMemberList)
            .map((member) => {
                let returnObject = member;
                let userMember = (users.List).filter((o) => { return o.id == member.id });
                return { ...member, 'user': userMember[0] };
            })
            .value();
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
                            (userMemberList.length > 0) && userMemberList.map((data, index) => {
                                return (
                                    <tr key={index}>
                                        <td class="text-center">{data.user.id}</td>
                                        <td class="text-left">{data.user.username}</td>
                                        <td class="text-left">{data.user.firstName}</td>
                                        <td class="text-left">{data.user.lastName}</td>
                                        <td class="text-left">{data.user.emailAddress}</td>
                                        <td class="text-center">{data.user.userType}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(data.user.role, (el) => { return el.role_role }))}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(data.user.team, (el) => { return el.team_team }))}</td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}