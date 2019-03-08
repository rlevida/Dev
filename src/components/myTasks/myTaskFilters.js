import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task
    }
})

export default class MyTaskFilters extends React.Component {
    constructor(props) {
        super(props);

        _.map(["setTaskList"], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_TASK_FILTER", filter: { type: "assignedToMe" } });
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

    render() {
        const { task, dispatch } = { ...this.props };
        const tabs = [
            { id: "assignedToMe", name: 'Assigned to me' },
            { id: "myTeam", name: "My Team" },
            { id: "following", name: "Following" }
        ];

        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
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
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
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