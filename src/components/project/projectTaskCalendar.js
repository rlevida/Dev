import React from "react";
import _ from "lodash";
import { connect } from "react-redux";

import TaskCalendar from "../task/taskCalendar";
import TaskFilters from "../task/taskFilter";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class ProjectTaskCalendar extends React.Component {
    render() {
        const { dispatch, loggedUser } = { ...this.props };
        return (
            <div class="card">
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-12 pd0">
                                <h3 class="title m0">Calendar</h3>
                            </div>
                            <div class="col-md-6 col-sm-12 pd0">
                                <div class="button-action filter">
                                    <TaskFilters
                                        show_tab={false}
                                        show_action={false}
                                    />
                                    {
                                        (loggedUser.data.userRole <= 4) && <a class="ml15 btn btn-default"
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
                        </div>
                    </div>
                </div>
                <TaskCalendar is_card={false} />
            </div>
        )
    }
}