import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task
    }
})

export default class TaskFilter extends React.Component {
    constructor(props) {
        super(props);

        _.map(["setTaskList"], (fn) => {
            this[fn] = this[fn].bind(this);
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
        const { task } = { ...this.props };
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
                        {/* <div class="add-action">
                            <DropDown multiple={false}
                                required={false}
                                options={statusList}
                                selected={Filter.projectStatus}
                                onChange={(e) => this.setDropDown("projectStatus", e.value)} />
                            <a class="btn btn-default" onClick={(e) => {
                                dispatch({ type: "SET_PROJECT_SELECTED", Selected: { isActive: true } });
                                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
                            }}
                            >
                                <span>
                                    <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                    Add New Project
                                </span>
                            </a>
                        </div> */}
                    </div>
                </div>
            </div>
        )
    }
}