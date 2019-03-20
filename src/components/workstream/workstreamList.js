import React from "react";
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import _ from "lodash";

import { showToast, getData, deleteData } from '../../globalFunction';
import { Loading, DeleteModal } from "../../globalComponents";

import WorkstreamFilter from "./workstreamFilter";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream
    }
})

export default class WorkstreamList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "getList",
            "getNext",
            "deleteData",
            "editData",
            "confirmDelete",
            "renderStatus",
            'renderList'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { workstream } = { ...this.props };
        if (_.isEmpty(workstream.Count)) {
            this.getList(1);
        }
    }

    getList(page) {
        const { dispatch, loggedUser, project: projectObj, workstream, match } = this.props;
        const { typeId, workstreamStatus, workstream: workstreamFilter } = workstream.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");
        const projectId = (typeof projectObj.Selected.id != "undefined") ? projectObj.Selected.id : match.params.projectId;
        const requestUrl = `/api/workstream?projectId=${projectId}&page=${page}&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}&typeId=${typeId}&workstreamStatus=${workstreamStatus}&dueDate=${dueDateMoment}&workstream=${workstreamFilter}&isDeleted=0`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
                showToast("success", "Workstream successfully retrieved.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    getNext() {
        const { dispatch, workstream } = { ...this.props };
        const { Count } = workstream;

        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
        this.getList(Count.current_page + 1);
    }

    deleteData(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ...value, action: 'delete' } })
        $(`#delete-workstream`).modal("show");
    }

    editData(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: value });
        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" });
    }

    confirmDelete() {
        const { workstream, dispatch } = { ...this.props };
        const { id } = workstream.Selected;

        deleteData(`/api/workstream/${id}`, { isDeleted: 0 }, (c) => {
            dispatch({ type: 'REMOVE_DELETED_WORKSTREAM_LIST', id: id });
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: "" });

            showToast("success", "Workstream successfully deleted.");
            $(`#delete-workstream`).modal("hide");
        });
    }

    renderStatus({ issues, dueToday }) {
        const color = (issues > 0) ? "text-red" : (dueToday > 0) ? "text-yellow" : "text-green";
        return (<span class={`fa fa-circle mb0 mr5 ${color}`}></span>);
    }

    renderList() {
        const { workstream, project } = { ...this.props };
        const workstreamCurrentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const workstreamLastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;
        return (
            <div>
                <div class={(workstream.Loading == "RETRIEVING" && (workstream.List).length == 0) ? "linear-background" : ""}>
                    {
                        ((workstream.List).length > 0) && <table class="mt20">
                            <thead>
                                <tr>
                                    <th scope="col" class="td-left">Workstream Name</th>
                                    <th scope="col">Completion</th>
                                    <th scope="col">For Approval</th>
                                    <th scope="col">Issues</th>
                                    <th scope="col">New Docs</th>
                                    <th scope="col">Messages</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.map(workstream.List, (data, index) => {
                                        return (
                                            <tr
                                                key={index}
                                            >
                                                <td data-label="Workstream Name" class="td-left">
                                                    <p class="m0">
                                                        {((data.task).length > 0) ? this.renderStatus(data) : ""}
                                                        <Link to={`/projects/${project.Selected.id}/workstreams/${data.id}`}>{data.workstream}</Link>
                                                    </p>
                                                </td>
                                                <td data-label="Completion">{(data.completion_rate.completed.value).toFixed(2) + "%"}</td>
                                                <td data-label="For Approval">
                                                    {(data.completion_rate.tasks_for_approval.count > 0) && <p class="text-orange m0">{data.completion_rate.tasks_for_approval.count} task(s)</p>}
                                                </td>
                                                <td data-label="Issues">
                                                    {
                                                        (data.completion_rate.delayed_task.count > 0) && <p class="text-red m0">{data.completion_rate.delayed_task.count} delayed</p>
                                                    }
                                                </td>
                                                <td data-label="New Docs">
                                                    {
                                                        (data.new_documents > 0) && <p class="text-red m0">{data.new_documents} file(s)</p>
                                                    }
                                                </td>
                                                <td data-label="Messages">
                                                    {
                                                        (data.messages > 0) && <p class="text-blue m0">{data.messages} message(s)</p>
                                                    }
                                                </td>
                                                <td data-label="Actions">
                                                    <a href="javascript:void(0);"
                                                        onClick={() => this.editData(data)}
                                                        class="btn btn-action">
                                                        <span class="glyphicon glyphicon-pencil" title="EDIT"></span>
                                                    </a>
                                                    <a href="javascript:void(0);" title="DELETE"
                                                        onClick={(e) => this.deleteData(data)}
                                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-action'}
                                                    >
                                                        <span class="glyphicon glyphicon-trash"></span>
                                                    </a>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    }
                </div>
                {
                    (workstream.List.length == 0 && workstream.Loading != "RETRIEVING") && <p class="mb0 mt10 text-center"><strong>No Records Found</strong></p>
                }
                {
                    (workstream.Loading == "RETRIEVING" && (workstream.List).length > 0) && <Loading />
                }
                {
                    (_.isEmpty(workstream) == false && (workstreamCurrentPage != workstreamLastPage) && workstream.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Workstream</a></p>
                }
            </div>
        )
    }


    render() {
        const { workstream, dispatch, is_card = true } = { ...this.props };
        const typeValue = (typeof workstream.Selected.workstream != "undefined" && _.isEmpty(workstream.Selected) == false) ? workstream.Selected.workstream : "";

        return (
            <div>
                <div class="row">
                    <div class="col-lg-12">
                        {
                            (is_card) ? <div class="card">
                                <div class="mb20 bb">
                                    <div class="container-fluid filter mb20">
                                        <div class="row content-row">
                                            <div class="col-md-6 col-sm-12">
                                                <h3 class="title m0">Workstreams</h3>
                                            </div>
                                            <div class="col-md-6 col-sm-12">
                                                <div class="button-action">
                                                    <WorkstreamFilter />
                                                    <a class="btn btn-default" onClick={() => { dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" }) }}>
                                                        <span><i class="fa fa-plus mr10" aria-hidden="true"></i></span>
                                                        Add New Workstream
                                                        </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {this.renderList()}
                            </div> : this.renderList()
                        }
                    </div>
                </div>
                {/* Modals */}
                <DeleteModal
                    id="delete-workstream"
                    type={'workstream'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                    cancel_function={() => { dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: "" }); }}
                />
            </div>
        )
    }
}