import React from "react";
import _ from "lodash";
import moment from "moment";

export const TaskDetails = (props) => {
    const { task: taskObj, handleAction, completeChecklist } = { ...props };
    const { Loading, Selected } = taskObj;
    const { id, task, task_members, dueDate, workstream, status, description, checklist } = Selected;

    return (
        <div class="modal right fade" id="task-details">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <a class="text-grey" data-dismiss="modal" aria-label="Close">
                            <span>
                                <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                <strong>Back</strong>
                            </span>
                        </a>
                        <div class="row mt20 content-row">
                            <div class="col-md-6 modal-action">
                                <a class="btn btn-default">
                                    <span>
                                        <i class="fa fa-check mr10" aria-hidden="true"></i>
                                        Complete
                                    </span>
                                </a>
                            </div>
                            <div class="col-md-6">
                                <div class="button-action">
                                    <a class="logo-action text-grey"><i title="FAVORITE" class="fa fa-star-o" aria-hidden="true"></i></a>
                                    <a data-dismiss="modal" onClick={() => handleAction("edit")} class="logo-action text-grey"><i title="EDIT" class="fa fa-pencil" aria-hidden="true"></i></a>
                                    <a class="logo-action text-grey"><i title="DELETE" class="fa fa-trash-o" aria-hidden="true"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class={(Loading == "RETRIEVING") ? "linear-background" : ""}>
                            {
                                (typeof id != "undefined") && <div>
                                    <h2 class="mt20 mb20">{task}</h2>
                                    <div class="row mb20">
                                        <div class="col-md-6">
                                            <div class="label-div">
                                                <label>Assigned:</label>
                                                <p class="m0">
                                                    {
                                                        _.map(task_members, (member, index) => {
                                                            const { user } = member;
                                                            return (
                                                                <span key={index}>{user.firstName + " " + user.lastName}</span>
                                                            )
                                                        })
                                                    }
                                                </p>
                                            </div>
                                            <div class="label-div">
                                                <label>Project:</label>
                                                <p class="m0 text-green">
                                                    <strong>{workstream.project.project}</strong>
                                                </p>
                                            </div>
                                            <div class="label-div">
                                                <label>Workstream:</label>
                                                <p class="m0">
                                                    {workstream.workstream}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="label-div">
                                                <label>Due Date:</label>
                                                <p class="m0">
                                                    {
                                                        moment(dueDate).format("MMMM DD, YYYY")
                                                    }
                                                </p>
                                            </div>
                                            <div class="label-div">
                                                <label>Status:</label>
                                                <p class="m0">
                                                    {
                                                        status
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row mb20">
                                        <div class="col-md-12">
                                            <div class="bb pb50">
                                                <p class="m0">{description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row mb20">
                                        <div class="col-md-12">
                                            <div>
                                                <h3>
                                                    Checklist
                                                </h3>
                                                <div class="ml20">
                                                    {
                                                        _.map(checklist, (checklistObj, index) => {
                                                            const { id, isCompleted, description } = { ...checklistObj };
                                                            return (
                                                                <div key={index}>
                                                                    <label class="custom-checkbox todo-checklist">
                                                                        {description}
                                                                        <input type="checkbox"
                                                                            checked={isCompleted ? true : false}
                                                                            onChange={() => { }}
                                                                            onClick={() => completeChecklist(id)}
                                                                        />
                                                                        <span class="checkmark"></span>
                                                                    </label>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                    {
                                                        ((checklist).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}