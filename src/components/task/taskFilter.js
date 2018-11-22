import React from "react";
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, showToast, setDatePicker, displayDate } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
        loggedUser: store.loggedUser,
        task: store.task
    }
})

export default class ProjectFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
        this.handleDate = this.handleDate.bind(this);
        this.getMemberList = this.getMemberList.bind(this);
    }

    componentDidUpdate(prevProps) {
        const { dispatch } = this.props;

        if (_.isEqual(prevProps.task.Filter, this.props.task.Filter) == false) {
            const { taskStatus, dueDate, taskAssigned } = this.props.task.Filter;
            let requestUrl = `/api/task?projectId=${project}&page=1`;

            dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_TASK_LIST", list: [] });

            if (taskStatus != "") {
                requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
            }

            if (dueDate != "") {
                requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
            }

            if (taskAssigned != "" && taskAssigned.length > 0) {
                taskAssigned.map((assignedObj) => {
                    requestUrl += `&userId=${assignedObj.value}`
                });
            }

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(requestUrl, {}, (c) => {
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                    showToast("success", "Task successfully retrieved.");
                });
            }, 1500);
        }

        setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TASK_FILTER", filter: { [name]: e } });
    }

    setDropDownMultiple(name, values) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TASK_FILTER", filter: { [name]: values } });
    }

    handleDate(e) {
        const { dispatch } = this.props;
        const selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY-MM-DD') : '';
        dispatch({ type: "SET_TASK_FILTER", filter: { [e.target.name]: selectedDate } });
    }

    getMemberList(options) {
        const { dispatch } = this.props;

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member?linkType=project&linkId=${project}&page=1&memberName=${options}`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                        .value();
                    dispatch({ type: "SET_TASK_SELECT_LIST", List: taskMemberOptions });
                });
            }, 1000)
        }
    }

    render() {
        const { task } = this.props;
        const { Filter } = { ...task }
        const statusList = [
            { id: "", name: "All Status" },
            { id: "For Approval", name: "For Approval" },
            { id: "Completed", name: "Completed" },
            { id: "Rejected", name: "Rejected" }
        ];
        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-4 mb5">
                        <label>Task Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={Filter.taskStatus}
                            onChange={(e) => this.setDropDown("taskStatus", e.value)} />
                    </div>
                    <div class="col-md-4 mb5">
                        <div class="input-group date">
                            <label>Task Due Date</label>
                            <input type="text"
                                class="form-control datepicker"
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 4
                                }}
                                id="dueDate"
                                name="dueDate"
                                value={((typeof Filter.dueDate != "undefined" && Filter.dueDate != null) && Filter.dueDate != '') ? displayDate(Filter.dueDate) : ""}
                            />
                        </div>
                    </div>
                    <div class="col-md-4 mb5">
                        <label>Assigned</label>
                        <DropDown
                            multiple={true}
                            options={task.SelectList}
                            onInputChange={this.getMemberList}
                            selected={(typeof Filter.taskAssigned == "undefined" || Filter.taskAssigned == "") ? [] : Filter.taskAssigned}
                            placeholder={"Type to Search Member"}
                            onChange={(e) => this.setDropDownMultiple("taskAssigned", e)}
                            isClearable={true}
                        />
                    </div>
                </div>
            </div>
        )
    }
}