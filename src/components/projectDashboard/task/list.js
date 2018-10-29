import React from "react";
import { connect } from "react-redux"
import moment from 'moment'

import { showToast, getData } from "../../../globalFunction";
import { Loading } from "../../../globalComponents";

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})

export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this);
        this.updateActiveStatus = this.updateActiveStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { socket, task } = this.props;
        const { Count } = task;

        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }

        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
    }


    fetchData(page) {
        const { loggedUser, dispatch } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.role, (roleObj) => { return roleObj.roleId })[0];
        getData(`/api/task?projectId=${project}&userId=${loggedUser.data.id}&page=${page}&role=${userRoles}`, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            showToast("success", "Task successfully retrieved.");
        });
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_TASK_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_TASK", { id: id })
        }
    }

    render() {
        let { task } = this.props;
        const taskList = _(task.List)
            .map((taskObj) => { return { ...taskObj, due_date_int: moment(taskObj.dueDate).format("YYYYMMDD") } })
            .orderBy(['due_date_int'], ['asc'])
            .value();

        return (
            <div>
                <table id="dataTable" class="table responsive-table m0">
                    <tbody>
                        <tr>
                            <th class="text-left">Task</th>
                            <th class="text-left">WorkStream</th>
                            <th class="text-center">Due Date</th>
                        </tr>
                        {
                            (taskList.length == 0) &&
                            <tr>
                                <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            taskList.map((data, index) => {
                                return <tr key={index}>
                                    <td class="text-left">{data.task}</td>
                                    <td class="text-left">{data.workstream.workstream}</td>
                                    <td class="text-center">{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                </tr>
                            })
                        }

                    </tbody>
                </table>
                {
                    (task.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}