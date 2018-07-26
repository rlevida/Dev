import React from "react";
import Tooltip from "react-tooltip";
import { showToast, displayDate, numberFormat } from '../../globalFunction';
import { HeaderButtonContainer, HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_WORKSTREAM_LIST", {});
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_WORKSTREAM", { id: id })
        }
    }

    render() {
        let { workstream, dispatch, socket } = this.props;

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })} >
                    <span>New Workstream</span>
                </li>
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th>Workstream</th>
                        <th>Pending</th>
                        <th>Completed</th>
                        <th>Issues</th>
                        <th>New Docs</th>
                        <th>Members</th>
                        <th>Type</th>
                        <th></th>
                    </tr>
                    {
                        (workstream.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        workstream.List.map((data, index) => {
                            return <tr key={index}>
                                <td>{data.status_status}</td>
                                <td>{data.workstream}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>{data.type_type}</td>
                                <td></td>
                                <td class="text-center">
                                    <a href="javascript:void(0);" data-tip="EDIT"
                                        onClick={(e) => socket.emit("GET_WORKSTREAM_DETAIL", { id: data.id })}
                                        class="btn btn-info btn-sm">
                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                    <a href="javascript:void(0);" data-tip="DELETE"
                                        onClick={e => this.deleteData(data.id)}
                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                        <span class="glyphicon glyphicon-trash"></span></a>
                                    <Tooltip />
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}