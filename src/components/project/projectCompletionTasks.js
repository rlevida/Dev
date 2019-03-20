import React from "react";
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import moment from 'moment';

@connect((store) => {
    return {
        task: store.task
    }
})
export default class ProjectCompletionTasks extends React.Component {
    constructor(props) {
        super(props)

        _.map([
            "viewAllTasks",
            "viewTask"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    viewAllTasks() {
        const { handleRedirect, task } = { ...this.props };
        const { List } = task;
        const projectId = List[0].projectId;
        handleRedirect(`/projects/${projectId}/workstreams`);
    }
    viewTask({ id, workstreamId, projectId }) {
        const { handleRedirect } = { ...this.props };
        handleRedirect(`/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`);
    }
    render() {
        const { task } = { ...this.props };
        const { Loading, List } = task;

        return (
            <div class="modal fade" id="completion-tasks" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <a class="text-grey" data-dismiss="modal" aria-label="Close">
                                <span>
                                    <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                    <strong>Back</strong>
                                </span>
                            </a>
                        </div>
                        <div class="modal-body pt0">
                            <h2 class="mt20 mb0">Tasks</h2>
                            <div class={(Loading == "RETRIEVING") ? "linear-background" : ""}>
                                {
                                    ((List).length > 0) && <table id="late-task">
                                        <thead>
                                            <tr>
                                                <th scope="col" class="td-left">Task Name</th>
                                                <th scope="col">Assigned</th>
                                                <th scope="col">Deadline</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                _.map(_.filter(List, (o, i) => { return i < 4 }), ({ id, task, task_members, dueDate, status, workstream, projectId }, index) => {
                                                    const given = moment(dueDate, "YYYY-MM-DD");
                                                    const current = moment().startOf('day');
                                                    const assigned = _(task_members)
                                                        .filter((o) => { return o.memberType == "assignedTo" })
                                                        .map((o) => { return o.user.firstName + " " + o.user.lastName })
                                                        .value();
                                                    let daysRemaining = (dueDate != "") ? moment.duration(given.diff(current)).asDays() + 1 : 0;
                                                    daysRemaining = (daysRemaining == 0 && dueDate != "") ? 1 : daysRemaining;

                                                    const colorClass = (daysRemaining < 0 && status != "Completed") ? "text-red" :
                                                        (status == "For Approval") ? "text-orange" : (status == "Completed") ? "text-green" : "";

                                                    return (
                                                        <tr key={index}>
                                                            <td data-label="Task Name" class="td-left">
                                                                <p class="m0">
                                                                    <a class={`${colorClass}`} onClick={() => this.viewTask({ id, workstreamId: workstream.id, projectId })} data-dismiss="modal">
                                                                        {task}
                                                                    </a>
                                                                </p>
                                                            </td>
                                                            <td data-label="Assigned">
                                                                {
                                                                    assigned.join("\r\n")
                                                                }
                                                            </td>
                                                            <td data-label="Deadline" class="m0">
                                                                {
                                                                    `${(dueDate != "" && dueDate != null) ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"}`
                                                                }
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                }
                                {
                                    (Loading != "RETRIEVING" && (List).length > 4) && <p class="mb0 text-center">
                                        <a onClick={this.viewAllTasks} data-dismiss="modal">View All Tasks</a>
                                    </p>
                                }
                                {
                                    ((List).length == 0 && Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                }

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}