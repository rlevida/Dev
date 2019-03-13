import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task
    }
})

export default class MyTaskFilters extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "setTaskList",
            "handleChange",
            "handleShowSearch"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch, task } = this.props;
        const filterType = (task.Filter.type == "") ? "assignedToMe" : task.Filter.type

        dispatch({ type: "SET_TASK_FILTER", filter: { type: filterType } });
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

    setTaskList(name, values) {
        const { dispatch, task } = this.props;

        if (task.Filter.type != values) {
            dispatch({ type: "SET_TASK_FILTER", filter: { [name]: values } });
            dispatch({ type: "SET_TASK_LIST", list: [] });
        }
    }

    handleChange(e) {
        const { dispatch } = this.props;
        const filterState = { [e.target.name]: e.target.value };

        if (typeof e.key != "undefined" && e.key === 'Enter') {
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: filterState });
        }
    }

    handleShowSearch() {
        const { dispatch } = this.props;
        const { searchInput = "", searchIcon = "" } = { ...this.refs };
        const searchClassList = (searchInput != "") ? searchInput.classList : "";
        const searchIconClassList = (searchIcon != "") ? searchIcon.classList : "";

        if (searchClassList.contains('hide')) {
            (searchClassList).remove('hide');
            (searchIconClassList).remove('fa-search');
            (searchIconClassList).add('fa-times-circle-o');
        } else {
            (searchClassList).add('hide');
            (searchIconClassList).remove('fa-times-circle-o');
            (searchIconClassList).add('fa-search');
            searchInput.value = "";
            dispatch({ type: "SET_TASK_FILTER", filter: { task: "" } });
        }
    }

    render() {
        const { task, dispatch } = { ...this.props };
        const tabs = [
            { id: "assignedToMe", name: 'Assigned to me' },
            { id: "myTeam", name: "My Team" },
            { id: "following", name: "Following" }
        ];

        return (
            <div class="container-fluid filter mb20">
                <div class="row">
                    <div class="col-md-6 col-sm-12 col-xs-12 pd0">
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
                    <div class="col-md-6 col-sm-12 col-xs-12 pd0" >
                        <div class="button-action">
                            <div class="mr10 hide" ref="searchInput" >
                                <input
                                    type="text"
                                    name="task"
                                    class="form-control"
                                    placeholder="Type and press enter to search"
                                    onKeyPress={this.handleChange}
                                />
                            </div>
                            <a
                                class="logo-action text-grey"
                                onClick={this.handleShowSearch}
                            >
                                <i ref="searchIcon" class="fa fa-search" aria-hidden="true"></i>
                            </a>
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
                            <a class="btn btn-default"
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
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}