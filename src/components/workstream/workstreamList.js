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
            "confirmDelete"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { project } = { ...this.props };

        if (_.isEmpty(project.Selected) == false && typeof project.Selected.id != "undefined") {
            this.getList(1);
        }
    }

    getList(page) {
        const { dispatch, loggedUser, project, workstream } = this.props;
        const { typeId, workstreamStatus, workstream: workstreamFilter } = workstream.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");
        const requestUrl = `/api/workstream?projectId=${project.Selected.id}&page=${page}&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}&typeId=${typeId}&workstreamStatus=${workstreamStatus}&dueDate=${dueDateMoment}&workstream=${workstreamFilter}&isDeleted=0`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
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
    }

    confirmDelete() {
        const { workstream, dispatch } = { ...this.props };
        const { id } = workstream.Selected;
        deleteData(`/api/workstream/${id}`, { isDeleted: 0 }, (c) => {
            dispatch({ type: 'REMOVE_DELETED_WORKSTREAM_LIST', id: id });
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: "" });

            showToast("success", "Successfully Deleted");
            $(`#delete-workstream`).modal("hide");
        });

    }


    render() {
        const { workstream } = { ...this.props };
        const workstreamCurrentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const workstreamLastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;
        const typeValue = (typeof workstream.Selected.workstream != "undefined" && _.isEmpty(workstream.Selected) == false) ? workstream.Selected.workstream : "";

        return (
            <div>

                <table class="mt20">
                    <thead>
                        <tr>
                            <th scope="col">Workstream</th>
                            <th scope="col">Pending</th>
                            <th scope="col">Completed</th>
                            <th scope="col">Issues</th>
                            <th scope="col">New Document(s)</th>
                            <th scope="col">Members</th>
                            <th scope="col">Type</th>
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
                                        <td data-label="Workstream">
                                            {data.workstream}
                                        </td>
                                        <td data-label="Pending">{(data.pending).length}</td>
                                        <td data-label="Completed">{(data.completed).length}</td>
                                        <td data-label="Issues">{(data.issues).length}</td>
                                        <td data-label="New Document(s)">{(data.new_documents).length}</td>
                                        <td data-label="Members">{(data.members.length > 0) &&
                                            <span title={`${
                                                (_(data.members)
                                                    .uniqBy((o) => {
                                                        return o.user.id
                                                    })
                                                    .map((o) => { return o.user.firstName + " " + o.user.lastName })
                                                    .value())
                                                    .join("\r\n")}`}>
                                                <i class="fa fa-users fa-lg"></i>
                                            </span>}
                                        </td>
                                        <td data-label="Type"><span title={`${data.type.type}`} class={data.type.type == "Output based" ? "fa fa-calendar" : "glyphicon glyphicon-time"}></span></td>
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
                {
                    (workstream.List.length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                }
                {
                    (workstream.Loading == "RETRIEVING") && <Loading />
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