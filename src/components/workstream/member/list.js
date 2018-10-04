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
        let workstreamMembers = workstream.Selected.memberIds.split(",");
        let userMemberList = workstreamMembers.map( e => { 
            let userMember = users.List.filter((o) => { return o.id == e})[0];
            return { ...userMember } 
        })
           
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
                                        <td class="text-center">{data.id}</td>
                                        <td class="text-left">{data.username}</td>
                                        <td class="text-left">{data.firstName}</td>
                                        <td class="text-left">{data.lastName}</td>
                                        <td class="text-left">{data.emailAddress}</td>
                                        <td class="text-center">{data.userType}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(data.role, (el) => { return el.role_role }))}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(data.team, (el) => { return el.team_team }))}</td>
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