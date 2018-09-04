import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        global : store.global
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

    }

    render() {
        let { workstream , global } = this.props;
        return <div>
            <h3>&nbsp;&nbsp;&nbsp;&nbsp;Members</h3>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    {
                        (workstream.Selected.taskMemberList.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        workstream.Selected.taskMemberList.map((data, index) => {
                            return <tr key={index}>
                                <td><i class="fa fa-user"></i></td>
                                <td>{`${data.firstName} ${data.lastName}`}</td>
                                <td>{`${data.role}`}</td>
                                <td> { data.memberType == "assignedTo" ? "Assigned" : data.memberType}</td>
                            </tr>
                        })
                    }
                    { workstream.Selected.taskMemberList.length > 0 && global.SelectList.ProjectMemberList.length > 0 &&
                       global.SelectList.ProjectMemberList.map((data , index)=>{
                            if(data.id == workstream.Selected.responsible){
                                return(
                                     <tr key={index}>
                                        <td><i class="fa fa-user"></i></td>
                                        <td>{`${data.firstName} ${data.lastName}`}</td>
                                        <td>{`${data.role}`}</td>
                                        <td>Responsible</td>
                                    </tr>
                                )
                            }
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}