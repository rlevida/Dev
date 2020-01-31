import React from "react";
import { connect } from "react-redux";
import { Loading as LoadingComponent } from "../../globalComponents";
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
        let redirectURL = "";

        if (List[0].list_type == "project") {
            redirectURL = `/projects/${List[0].link_type_id}/workstreams`;
        } else {
            redirectURL = `/projects/${List[0].projectId}/workstreams/${List[0].link_type_id}`;
        }

        handleRedirect(redirectURL);
    }
    viewTask({ id, workstreamId, projectId }) {
        const { handleRedirect } = { ...this.props };
        handleRedirect(`/projects/${projectId}/workstreams/${workstreamId}?task-id=${id}`);
    }
    render() {
        const { task, paginate = false, handlePaginate, dispatch } = { ...this.props };
        const { Loading, List, Count } = task;
        const taskList = (paginate == false) ? _.take(List, 4) : List;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        
        return (
            <div class="modal fade" id="completion-tasks" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <a class="text-grey" data-dismiss="modal" aria-label="Close" onClick={() => {
                                dispatch({ type: "SET_TASK_LIST", list: [], count: {} });
                                dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
                            }}>
                                <span>
                                    <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                    <strong>Back</strong>
                                </span>
                            </a>
                        </div>
                        <div class="modal-body">
                            <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
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
                                                _.map(taskList, ({ id, task, task_members, dueDate, status, workstream, projectId }, index) => {
                                                    const given = moment(dueDate, "YYYY-MM-DD");
                                                    const current = moment().startOf('day');
                                                    const assigned = _.find(task_members, (o) => { return o.memberType == "assignedTo" });
                                                    let daysRemaining = (dueDate != "") ? moment.duration(given.diff(current)).asDays() + 1 : 0;

                                                    const colorClass = (daysRemaining < 0 && (status == "In Progress")) ? "text-red" :
                                                        (status == "For Approval") ? "text-orange" : (daysRemaining == 0 && status != "Completed") ? "text-yellow" : (status == "Completed") ? "text-green" : "";
                                                    return (
                                                        <tr key={index}>
                                                            <td data-label="Task Name" class="td-left">
                                                                <p class="m0">
                                                                    <a onClick={() => this.viewTask({ id, workstreamId: workstream.id, projectId })} data-dismiss="modal">
                                                                        {
                                                                            (colorClass != "") && <span class={`fa fa-circle mb0 mr5 ${colorClass}`}></span>
                                                                        }
                                                                        {task}
                                                                    </a>
                                                                </p>
                                                            </td>
                                                            <td data-label="Assigned">
                                                                <div class="display-flex">
                                                                    <div class="thumbnail-profile display-flex">
                                                                        <span title={assigned.user.firstName + " " + assigned.user.lastName}>
                                                                            <img src={assigned.user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                        </span>
                                                                    </div>
                                                                </div>
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
                                    (Loading != "RETRIEVING" && (List).length > 4 && paginate == false) && <p class="mb0 text-center">
                                        <a onClick={this.viewAllTasks} data-dismiss="modal">View All Tasks</a>
                                    </p>
                                }
                                {
                                    ((taskList).length == 0 && Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                }
                                {
                                    (paginate == true) && <div>
                                        {
                                            (Loading == "RETRIEVING" && (taskList).length > 0) && <LoadingComponent />
                                        }
                                        {
                                            (currentPage != lastPage && Loading != "RETRIEVING") && <p class="mb0 text-center">
                                                <a onClick={() => handlePaginate()}>Load More Tasks</a>
                                            </p>
                                        }
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}