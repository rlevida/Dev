import React from "react";
import { showToast, getData, deleteData } from '../../globalFunction';
import { Loading, DeleteModal } from "../../globalComponents";
import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream
    }
})

export default class workstreamList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "getList",
            "getNext",
            "deleteData",
            "editData",
            "confirmDelete",
            "renderStatus"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { project: projectObj, dispatch, workstream } = { ...this.props };

        if (_.isEmpty(workstream.Count)) {
            this.getList(1);
        }
    }

    getList(page) {
        const { dispatch, loggedUser, project: projectObj, workstream, project_id = "" } = this.props;
        const { typeId, workstreamStatus, workstream: workstreamFilter } = workstream.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");
        const projectId = (typeof projectObj.Selected.id != "undefined") ? projectObj.Selected.id : project_id;
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


    render() {
        const { workstream } = { ...this.props };
        const workstreamCurrentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const workstreamLastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;
        const typeValue = (typeof workstream.Selected.workstream != "undefined" && _.isEmpty(workstream.Selected) == false) ? workstream.Selected.workstream : "";

        return (
            <div>
                {
                    ((workstream.List).length > 0) && <table class="mt20">
                        <thead>
                            <tr>
                                <th scope="col">Workstream Name</th>
                                <th scope="col">Completion</th>
                                <th scope="col">For Approval</th>
                                <th scope="col">Issues</th>
                                <th scope="col">New Docs</th>
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
                                            <td data-label="Workstream Name" class="display-flex">
                                                {
                                                    ((data.task).length > 0) && this.renderStatus(data)
                                                }
                                                {data.workstream}
                                            </td>
                                            <td data-label="Completion">{data.completion + "%"}</td>
                                            <td data-label="For Approval">
                                                {(data.for_approval.amount > 0) && <p class={`${data.for_approval.color} m0`}>{data.for_approval.amount} task(s)</p>}
                                            </td>
                                            <td data-label="Issues">
                                                {
                                                    (data.issues > 0) && <p class="m0 text-red">{data.issues} delayed</p>
                                                }
                                            </td>
                                            <td data-label="New Docs">{`${data.new_documents} file(s)`}</td>
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
                {
                    (workstream.List.length == 0 && workstream.Loading != "RETRIEVING") && <p class="mb0 mt10 text-center"><strong>No Records Found</strong></p>
                }
                {
                    (workstream.Loading == "RETRIEVING" && (workstream.List).length > 0) && <Loading />
                }
                {
                    (_.isEmpty(workstream) == false && (workstreamCurrentPage != workstreamLastPage) && workstream.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Workstream</a></p>
                }
                {/* Modals */}
                <DeleteModal
                    id="delete-workstream"
                    type={'workstream'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
            </div>
        )
    }
}