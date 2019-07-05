import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData } from "../../globalFunction";
import { withRouter } from "react-router";
import { Loading } from "../../globalComponents";

@connect(store => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        document: store.document,
        task: store.task
    };
})
class TaskActiveFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            list: []
        };
    }

    componentDidMount() {
        this.fetchData(1);
    }

    fetchData(page) {
        const { loggedUser, project, task, dispatch } = this.props;
        let requestUrl = `/api/document/getFiles?&isArchived=0&isDeleted=0&projectId=${project.Selected.id}&linkType=task&linkId=${task.Selected.id}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${
            loggedUser.data.id
        }&isActive=1&type=document&folderId=null&tagType=document`;

        getData(requestUrl, {}, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: result });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }
    handleCheckbox(id, isChecked) {
        const { dispatch, document } = { ...this.props };
        const updateList = document.List.map(e => {
            if (id === e.id) {
                return { ...e, isChecked: !isChecked };
            } else {
                return e;
            }
        });
        dispatch({ type: "SET_DOCUMENT_LIST", list: updateList });
    }

    render() {
        const { document } = { ...this.props };
        return (
            <div>
                <table class="table-document mb10">
                    <thead>
                        <tr class="text-left">
                            <th scope="col" colSpan="2">
                                File Name
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {document.List.map((data, index) => {
                            const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`;
                            return (
                                <tr key={index}>
                                    <td class="document-name display-flex" colSpan="2">
                                        <label class="custom-checkbox mr10">
                                            <input
                                                type="checkbox"
                                                checked={data.isChecked}
                                                onClick={f => {
                                                    this.handleCheckbox(data.id, data.isChecked);
                                                }}
                                            />
                                            <span class="checkmark" />
                                        </label>
                                        {data.type === "folder" && <span class="fa fa-folder fa-lg read mr10" />}
                                        {data.type === "folder" && <span class="read">{documentName}</span>}
                                        {data.type === "document" && <span class={data.isRead ? "read" : "unread"}>{documentName}</span>}{" "}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {document.Loading == "RETRIEVING" && document.List.length > 0 && <Loading />}
                {document.List.length === 0 && document.Loading != "RETRIEVING" && (
                    <p class="mb0 text-center">
                        <strong>No Records Found</strong>
                    </p>
                )}
            </div>
        );
    }
}

export default withRouter(TaskActiveFile);
