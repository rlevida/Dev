import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, getData } from '../../globalFunction';
import { withRouter } from "react-router";
import DocumentList from "../document/documentList"

import EditModal from "../document/modal/editModal";
import DeleteModal from "../document/modal/deleteModal";
import ArchiveModal from "../document/modal/archiveModal";
import DocumentViewerModal from "../document/modal/documentViewerModal";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        document: store.document
    }
})

class WorkstreamDocument extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: 'CLEAR_DOCUMENT' });
    }

    componentDidMount() {
        this.fetchData(1)
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, project, workstream_id } = this.props;
        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project.Selected.id}&linkType=workstream&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstreamId=${workstream_id}&tagType=document&starredUser=${loggedUser.data.id}&type=document&isArchived=0`, {}, (c) => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: document.List.concat(result), count: count });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        const newData = { ...data, workstreamId: data.tagWorkstream };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ..._.omit(newData, ['status']), oldDocument: type === 'tags' ? data.tagWorkstream.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    downloadDocument(data) {
        if (data.type === 'document') {
            window.open(encodeURI(`/api/downloadDocument?fileName=${data.name}&origin=${data.origin}`));
        } else {
            window.open(encodeURI(`/api/downloadFolder?folder=${data.id}&folderName=${`${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`}`));
        }
    }

    gotoFolder(data) {
        const { history, project } = { ...this.props };
        if (data.document_folder) {
            history.push(`/projects/${project.Selected.id}/files?id=${data.folderId}&folder=${data.document_folder.origin}&status=${data.document_folder.status}`);
        } else {
            history.push(`/projects/${project.Selected.id}/files`)
        }
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${projectId}&document=${origin}`, {
            linkType: "document",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedDocumentList = _.map([...document.List], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, count: document.Count });
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    render() {
        return (
            <div>
                <DocumentList fetchWorkstreamDocument={(e) => this.fetchData(e)} />
                <EditModal />
                <DeleteModal />
                <ArchiveModal />
            </div>
        )
    }
}

export default withRouter(WorkstreamDocument);