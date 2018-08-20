import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        members: store.members,
        users : store.users
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

    }

    componentWillMount() {
        this.props.socket.emit("GET_MEMBERS_LIST",{ filter : { linkId : project, linkType: "project" } })
    }

    render() {
        let { task, dispatch, socket , members , users } = this.props;
        return <div>
            <h3>&nbsp;&nbsp;&nbsp;&nbsp;Members</h3>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    {
                        (members.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        members.List.map((data, index) => {
                            let userDetail = users.List.filter( e =>{ return e.id == data.userTypeLinkId })
                            return <tr key={index}>
                                <td><i class="fa fa-user"></i></td>
                                <td>{`${userDetail[0].firstName} ${userDetail[0].lastName}`}</td>
                                <td>{`${userDetail[0].role[0].role_role}`}</td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}