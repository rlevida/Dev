import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Searchbar, DropDown } from "../../globalComponents";
import { getData } from "../../globalFunction";

let keyTimer;

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task,
        users: store.users,
        settings: store.settings
    }
})

export default class TaskFilters extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "setTaskList",
            "handleChange",
            "setDropDown",
            "fetchUserList",
            "setAssignMemberUserList"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch, task, show_tab = true } = this.props;
        const filterType = (task.Filter.type == "" && show_tab) ? "assignedToMe" : task.Filter.type

        dispatch({ type: "SET_TASK_FILTER", filter: { type: filterType } });

        this.fetchUserList();
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({
            type: "SET_TASK_FILTER", filter: {
                taskStatus: "Active",
                dueDate: "",
                taskAssigned: "",
                task: "",
                selected_month: "",
                projectId: "",
                type: ""
            }
        });
    }

    fetchUserList(options) {
        const { dispatch, loggedUser, projectId = "", } = { ...this.props };

        if (projectId != "") {
            let projectMemberUrl = `/api/project/getProjectMembers?page=1&linkId=${projectId}&linkType=project`;

            if (typeof options != "undefined" && options != "") {
                projectMemberUrl += `&memberName=${options}`;
            }

            getData(projectMemberUrl, {}, (c) => {
                const taskMemberOptions = _(c.data)
                    .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName, image: e.avatar } })
                    .value();
                dispatch({ type: "SET_USER_SELECT_LIST", List: taskMemberOptions });
            });
        } else {
            let teamMemberUrl = `/api/teams/teammates?page=1&userId=${loggedUser.data.id}`;

            if (typeof options != "undefined" && options != "") {
                teamMemberUrl += `&memberName=${options}`;
            }

            getData(teamMemberUrl, {}, (c) => {
                const taskMemberOptions = _(c.data)
                    .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName, image: e.avatar } })
                    .value();
                dispatch({ type: "SET_USER_SELECT_LIST", List: taskMemberOptions });
            });
        }
    }

    setTaskList(name, values) {
        const { dispatch, task } = { ...this.props };

        if (task.Filter.type != values) {
            dispatch({ type: "SET_TASK_FILTER", filter: { [name]: values } });
            dispatch({ type: "SET_TASK_LIST", list: [] });
        }
    }

    handleChange(params) {
        const { dispatch, task } = this.props;

        if (task.Filter.task != params.task) {
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: params });
        }
    }

    setDropDown(name, e) {
        const { dispatch, task } = this.props;
        const { Filter } = task;

        if (Filter[name] != e) {
            dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: { [name]: e } });
        }
    }

    setAssignMemberUserList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchUserList(options);
        }, 1500);
    }
    render() {
        const { task, dispatch, users, show_tab = true, show_action = true, loggedUser, settings } = { ...this.props };
        const { Filter } = { ...task }
        const tabs = [
            { id: "assignedToMe", name: 'Assigned to me' },
            { id: "following", name: "Following" }
        ];
        if (loggedUser.data.userRole <= 3) {
            tabs.splice(1, 0, { id: "myTeam", name: "My Team" })
        }
        const statusList = [
            { id: "For Approval", name: "For Approval" },
            { id: "Completed", name: "Completed" },
            { id: "Rejected", name: "Rejected" }
        ];
        const enableFilter = !task.TaskCatergoryLoading['Today'] && !task.TaskCatergoryLoading['This week'] && !task.TaskCatergoryLoading['This month'] && !task.TaskCatergoryLoading['Succeeding month']

        return (
            <div class={`filter ${enableFilter ? '' : 'div-disabled'}`} >
                {
                    (show_action == true || show_tab == true) && <div class="row mb10">
                        {
                            (show_tab) && <div class="col-md-6 col-sm-12 col-xs-12 pd0" >
                                <div class="flex-row tab-row mb0">
                                    {
                                        _.map(tabs, (tab, index) => {
                                            return (
                                                <div class="flex-col" key={index}>
                                                    <a
                                                        class={(tab.id == task.Filter.type) ? "btn btn-default btn-active" : "btn btn-default"}
                                                        onClick={() => this.setTaskList("type", tab.id)}
                                                    >
                                                        {tab.name}
                                                    </a>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        }
                        {
                            (show_action) && <div class="col-md-6 col-sm-12 col-xs-12 pd0" >
                                <div class="button-action">
                                    <Searchbar
                                        handleChange={this.handleChange}
                                        handleCancel={() => {
                                            dispatch({ type: "SET_TASK_FILTER", filter: { task: "" } });
                                        }}
                                        name="task"
                                    />
                                    <a class="logo-action text-grey" onClick={() => {
                                        dispatch({
                                            type: "SET_TASK_FORM_ACTIVE",
                                            FormActive: (task.FormActive == "Calendar") ? "List" : "Calendar"
                                        });
                                    }}>
                                        {
                                            (task.FormActive == "Calendar") ? <i class="fa fa-list" aria-hidden="true"></i> : <i class="fa fa-calendar" aria-hidden="true"></i>
                                        }
                                    </a>
                                    {
                                        (loggedUser.data.userRole <= 4) && <a class="btn btn-default"
                                            onClick={(e) => {
                                                dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
                                                dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                            }}
                                        >
                                            <span>
                                                <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                                Add New Task
                                    </span>
                                        </a>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                }
                <div class="flex-row filter-row">
                    <div class="flex-col">
                        <DropDown
                            options={statusList}
                            selected={Filter.taskStatus}
                            onChange={(e) => {
                                this.setDropDown("taskStatus", (e == null) ? "Active" : e.value);
                            }}
                            placeholder={"Task Status"}
                            isClearable={true}
                        />
                    </div>
                    {
                        (task.Filter.type != "assignedToMe" || show_tab == false) && <div class="flex-col">
                            <DropDown
                                options={users.SelectList}
                                onInputChange={this.setAssignMemberUserList}
                                selected={Filter.taskAssigned}
                                onChange={(e) => {
                                    this.setDropDown("taskAssigned", (e == null) ? "" : e.value);
                                }}
                                placeholder={"Assigned"}
                                isClearable={true}
                                customLabel={(o) => {
                                    return (
                                        <div class="drop-profile">
                                            {
                                                (o.image != "") && <img
                                                    src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                    alt="Profile Picture" class="img-responsive" />
                                            }
                                            <p class="m0">{o.label}</p>
                                        </div>
                                    );
                                }}
                                customSelected={({ value: o }) => {
                                    return (
                                        <div class="drop-profile" title={o.label}>
                                            {
                                                (o.image != "") && <img
                                                    src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                    alt="Profile Picture" class="img-responsive" />
                                            }
                                            <p class="m0">{(o.label).substring(0, 17)}{((o.label).length > 17) ? "..." : ""}</p>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    }
                </div>
            </div>
        )
    }
}