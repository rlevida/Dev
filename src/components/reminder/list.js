import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import { getData, putData } from "../../globalFunction";
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        users: store.users,
        reminder: store.reminder
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    viewReminder(data) {
        let { dispatch, socket } = this.props;
        if (data.linkType == "task") {
            if (Boolean(data.seen)) {
                window.location.href = `/project/${data.projectId}/workstream/${data.workstreamId}?task=${data.linkId}`;
            } else {
                putData(`/api/reminder/${data.id}`, {}, (c) => {
                    window.location.href = `/project/${data.projectId}/workstream/${data.workstreamId}?task=${data.linkId}`;
                })
            }
        }
    }
    render() {
        let { reminder, loggedUser } = this.props;
        let reminderUnseen = _.orderBy(reminder.List.filter(e => { return !e.seen }), ['dateAdded'], ['desc'])
        let reminderSeen = _.orderBy(reminder.List.filter(e => { return e.seen }), ['dateAdded'], ['desc'])// reminderSeen = _.orderBy()

        return <div>
            <div class="panel panel-default">
                <div class="panel-heading">
                    <h3 class="panel-title">Reminder</h3>
                </div>
                <div class="panel-body">
                    <table class="table responsive-table table-bordered">
                        <tbody>
                            <tr>
                                <th class="text-center"></th>
                                <th class="text-center">Reminder Detail</th>
                                <th class="text-center">Date</th>
                                <th></th>

                            </tr>
                            {reminderUnseen.length > 0 &&
                                reminderUnseen.map((data, index) => {
                                    return (
                                        <tr key={index} style={{ fontWeight: data.seen == 0 ? "bold" : "" }}>
                                            <td>{data.taskName}</td>
                                            <td>{data.detail}</td>
                                            <td>{moment(data.dueDate).format('YYYY MMM DD')}</td>
                                            <td><a href="javascript:void(0);" onClick={() => this.viewReminder(data)} class="btn btn-primary" data-tip="View"><span class="fa fa-eye"></span></a></td>
                                        </tr>
                                    )
                                })

                            }
                            {reminderSeen.length > 0 &&
                                reminderSeen.map((data, index) => {
                                    return (
                                        <tr key={index} style={{ fontWeight: data.seen == 0 ? "bold" : "" }}>
                                            <td>{data.taskName}</td>
                                            <td>{data.detail}</td>
                                            <td>{moment(data.dueDate).format('YYYY MMM DD')}</td>
                                            <td><a href="javascript:void(0);" onClick={() => this.viewReminder(data)} class="btn btn-primary" data-tip="View"><span class="fa fa-eye"></span></a></td>
                                        </tr>
                                    )
                                })
                            }
                            {
                                (reminderUnseen.length == 0 && reminderSeen.length == 0) &&
                                <tr>
                                    <td colSpan={8}>No Reminder Found!</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    }
}