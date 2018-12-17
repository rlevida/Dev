import React from "react";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { showToast, getData, putData, postData } from '../../globalFunction';

let keyTimer = "";

@connect((store) => {
    return {
        checklist: store.checklist,
        task: store.task,
        taskDependency: store.taskDependency,
        loggedUser: store.loggedUser,
        global: store.global,
        project: store.project,
        members: store.members
    }
})

export default class Reminder extends React.Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.getNextResult = this.getNextResult.bind(this);
    }

    fetchData(page) {
        const { dispatch, project, members, task } = this.props;
        getData(`/api/member?linkId=${project.Selected.id}&linkType=project&&page=${page}&isDeleted=0&taskId=${task.Selected.id}&workstreamId=${task.Selected.workstreamId}`, {}, (c) => {
            dispatch({ type: 'SET_MEMBERS_LIST', list: members.List.concat(c.data.result), count: c.data.count })
        })
    }

    getNextResult() {
        const { members } = this.props;
        dispatch({ type: 'SET_MEMBERS_LOADING', Loading: 'RETRIEVING' })
        this.fetchData(members.Count.current_page + 1)
    }

    handleCheckbox(name, data) {
        const { dispatch, task } = this.props;
        const dataToSubmit = {
            taskId: task.Selected.id,
            usersId: data.user.id,
            [name]: data.user.task_member_reminder.length
                ? data.user.task_member_reminder[0][name] ? 0 : 1
                : 1
        }
        if (data.user.task_member_reminder.length > 0) {
            const taskMember = data.user.task_member_reminder[0];
            putData(`/api/taskMemberReminder/${taskMember.id}?linkId=${project}&linkType=project&usersType=users&userTypeLinkId=${data.user.id}&taskId=${task.Selected.id}&workstreamId=${task.Selected.workstreamId}&memberId=${data.id}`, dataToSubmit, (c) => {
                dispatch({ type: 'UPDATE_DATA_MEMBERS_LIST', list: c.data });
                showToast('success', 'Successfully Updated.');
            })
        } else {
            postData(`/api/taskMemberReminder?linkId=${project}&linkType=project&usersType=users&userTypeLinkId=${data.user.id}&taskId=${task.Selected.id}&workstreamId=${task.Selected.workstreamId}&memberId=${data.id}`, dataToSubmit, (c) => {
                dispatch({ type: 'UPDATE_DATA_MEMBERS_LIST', list: c.data });
                showToast('success', 'Successfully Updated.');
            })
        }
    }

    render() {
        const { task, global, members } = { ...this.props };
        const currentPage = (typeof members.Count.current_page != "undefined") ? members.Count.current_page : 1;
        const lastPage = (typeof members.Count.last_page != "undefined") ? members.Count.last_page : 1;

        return (
            <div style={{ marginBottom: 25 }}>
                <table id="dataTable" class="table responsive-table table-bordered table-text-center">
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <th>Send default notification</th>
                            <th>Send email notification</th>
                        </tr>
                        {
                            members.List.map((data, i) => {
                                return (
                                    <tr key={i}>
                                        <td>{`${data.user.firstName} ${data.user.lastName}`}</td>
                                        <td>
                                            <input type="checkbox"
                                                style={{ width: "15px", marginTop: "10px" }}
                                                checked={
                                                    (data.user.task_member_reminder.length) ?
                                                        data.user.task_member_reminder[0].defaultNotification ? 1 : 0
                                                        : 0
                                                }
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox('defaultNotification', data) }}
                                            />
                                        </td>
                                        <td>
                                            <input type="checkbox"
                                                style={{ width: "15px", marginTop: "10px" }}
                                                checked={
                                                    (data.user.task_member_reminder.length) ?
                                                        data.user.task_member_reminder[0].emailNotification ? 1 : 0
                                                        : 0
                                                }
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox('emailNotification', data) }}
                                            />
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                <div class="text-center">
                    {
                        ((currentPage != lastPage) && members.List.length > 0 && members.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Members</a>
                    }
                    {
                        (members.List.length == 0 && members.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (members.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}