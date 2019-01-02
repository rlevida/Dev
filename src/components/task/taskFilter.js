import React from "react";
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, showToast, setDatePicker, displayDate } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        status: store.status,
        loggedUser: store.loggedUser,
        task: store.task,
        members: store.members,
        workstream: store.workstream
    }
})

export default class ProjectFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
        this.handleDate = this.handleDate.bind(this);
        this.getMemberList = this.getMemberList.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        const { dispatch } = this.props;

        getData(`/api/member/selectList?linkType=project&linkId=${project}&page=1`, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
        });

        setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, task: taskState, workstream } = this.props;

        if (_.isEqual(prevProps.task.Filter, this.props.task.Filter) == false && prevProps.task.FormActive == this.props.task.FormActive) {
            const { taskStatus, dueDate, taskAssigned, task, selected_month } = this.props.task.Filter;
            let requestUrl = `/api/task?projectId=${project}&starredUser=${loggedUser.data.id}`;
    
            if (taskStatus != "") {
                if (taskStatus === 'Active') {
                    requestUrl += `&status=${JSON.stringify({ opt: "not", value: 'Completed' })}`

                } else {
                    requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
                }
            }
            if (task != "") {
                requestUrl += `&task=${task}`
            }

            if (dueDate != "") {
                requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
            }

            if (selected_month != "" && (taskState.FormActive == "Calendar" || workstream.SelectedLink == "calendar")) {
                requestUrl += `&dueDate=${JSON.stringify({ opt: "between", value: selected_month })}`
            }

            if (taskAssigned != "" && taskAssigned.length > 0) {
                taskAssigned.map((assignedObj) => {
                    requestUrl += `&userId=${assignedObj.value}`
                });
            }

            if (taskState.FormActive == "Timeline") {
                requestUrl += `&listType=timeline`
            }

            if (workstream.SelectedLink == "timeline") {
                requestUrl += `&workstreamId=${workstream.Selected.id}`
            }

            if (taskState.FormActive != "Calendar" && workstream.SelectedLink != "calendar") {
                requestUrl += `&page=1`
            }

            if(workstream.SelectedLink === 'timeline'){
                requestUrl += `&listType=timeline`
            }

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(requestUrl, {}, (c) => {
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
                    dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                    showToast("success", "Task successfully retrieved.");
                });
            }, 1500);
            setDatePicker(this.handleDate, "dueDate", new Date(2019, 3, 20));
        }
    }

    setDropDown(name, e) {
        const { dispatch, task } = this.props;
        const { Filter } = task;

        if (Filter.taskStatus != e) {
            dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: { [name]: e } });
        }
    }

    setDropDownMultiple(name, values) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_TASK_FILTER", filter: { [name]: values } });
    }

    handleDate(e) {
        const { dispatch } = this.props;
        const selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY-MM-DD') : '';
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_TASK_FILTER", filter: { [e.target.name]: selectedDate } });
    }

    getMemberList(options) {
        const { dispatch, task } = this.props;
        const { Filter } = { ...task }

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member/selectList?linkType=project&linkId=${project}&page=1&memberName=${options}`, {}, (c) => {
                    let taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: Array.isArray(Filter.taskAssigned) ? _.concat(_.map(Filter.taskAssigned, (o) => { return { id: o.value, name: o.label } }), taskMemberOptions) : taskMemberOptions });
                });
            }, 1000)
        }
    }

    handleChange(e) {
        const { dispatch } = this.props;
        const filterState = { [e.target.name]: e.target.value };

        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_TASK_FILTER", filter: filterState });
    }

    render() {
        const { task, members } = this.props;
        const { Filter } = { ...task }
        const statusList = [
            { id: "Active", name: "Active" },
            { id: "", name: "All Status" },
            { id: "For Approval", name: "For Approval" },
            { id: "Completed", name: "Completed" },
            { id: "Rejected", name: "Rejected" }
        ];
        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-3 col-sm-12 col-xs-6 mb5">
                        <label>Task Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={Filter.taskStatus}
                            onChange={(e) => this.setDropDown("taskStatus", e.value)} />
                    </div>
                    <div class="col-md-2 col-sm-12 col-xs-6 mb5">
                        <div class="input-group date" style={{ width: "100%" }}>
                            <label>Task Due Date</label>
                            <input type="text"
                                class="form-control datepicker"
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 4
                                }}
                                id="dueDate"
                                name="dueDate"
                                value={((typeof Filter.dueDate != "undefined" && Filter.dueDate != null && Array.isArray(Filter.dueDate) == false) && Filter.dueDate != '') ? displayDate(Filter.dueDate) : ""}
                            />
                        </div>
                    </div>
                    <div class="col-md-4 col-sm-12 col-xs-12 mb5">
                        <label>Assigned</label>
                        <DropDown
                            multiple={true}
                            options={members.SelectList}
                            onInputChange={this.getMemberList}
                            selected={(typeof Filter.taskAssigned == "undefined" || Filter.taskAssigned == "") ? [] : Filter.taskAssigned}
                            placeholder={"Type to Search Member"}
                            onChange={(e) => this.setDropDownMultiple("taskAssigned", e)}
                            isClearable={true}
                        />
                    </div>
                    <div class="col-md-3 col-sm-12 col-xs-12 mb5">
                        <label>Task</label>
                        <input type="text" name="task" class="form-control" onChange={this.handleChange} />
                    </div>
                </div>
            </div>
        )
    }
}