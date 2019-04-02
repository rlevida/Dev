import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, displayDateMD } from '../../globalFunction';

import { connect } from "react-redux"
import { withRouter } from "react-router";

import DocumentSortFile from "./documentSortFile"

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class DocumentList extends React.Component {
    constructor(props) {
        super(props)
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        this.fetchData(1)
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props }
        dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
        dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
        dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder, match } = this.props;
        const projectId = match.params.projectId;
        const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo, status } = document.Filter;

        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;
        if (status === 'active' || status === 'sort') {
            requestUrl += `&folderId=null&type=document`
        }

        if (status === 'library') {
            requestUrl += `&folderId=null&type=folder`
        }
        // if (typeof isCompleted !== 'undefined' && isCompleted !== '') {
        //     requestUrl += `&isCompleted=${isCompleted}`
        // }
        // if (typeof search !== 'undefined' && search !== '') {
        //     requestUrl += `&search=${search}`
        // }
        // if (typeof tags !== 'undefined') {
        //     _.filter(tags, (t) => {
        //         const tagType = t.value.split('-')[0];
        //         const tagId = t.value.split('-')[1];
        //         if (tagType === 'workstream') {
        //             requestUrl += `&workstream=${tagId}`
        //         }
        //     })
        // }
        // if (typeof uploadedBy !== 'undefined' && uploadedBy !== '') {
        //     requestUrl += `&uploadedBy=${uploadedBy}`
        // }
        // if (typeof members !== 'undefined' && members !== '') {
        //     _.map(members, (e) => {
        //         requestUrl += `&members=${e.value}`
        //     })
        // }
        // if (typeof uploadFrom !== 'undefiend' && uploadFrom !== '') {
        //     requestUrl += `&uploadFrom=${uploadFrom}`
        // }
        // if (typeof uploadTo !== 'undefiend' && uploadTo !== '') {
        //     requestUrl += `&uploadTo=${uploadTo}`
        // }

        getData(requestUrl, {}, (c) => {
            const { count, result } = { ...c.data }
            dispatch({ type: 'SET_DOCUMENT_LIST', list: result, count: count });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' });
        });
    }

    async getFolderDocuments(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedFolderName;

        if (data === "") {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
            await dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
            await dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
            await this.fetchData(1);
            await history.push(`/projects/${projectId}/files`);
        } else if (folder.Selected.id !== data.id) {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }

                let hasFolder = true;
                let parentFolderId = data.id;
                while (hasFolder) {
                    let parentFolder = folderList.filter((e) => { return e.folderId == parentFolderId });
                    if (parentFolder.length > 0) {
                        folderList = folderList.filter((e) => { return e.folderId != parentFolderId });
                        parentFolderId = parentFolder[0].id;
                    } else {
                        hasFolder = false;
                    }
                }
                dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data })
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList });
            });
        }
    }

    getNextResult() {
        const { document } = this.props;
        this.fetchData(document.NewCount.Count.current_page + 1)
    }

    moveTo(folderData, documentData) {
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            origin: documentData.origin,
            status: folderData.status,
            folderId: folderData.id,
            actionType: "moved",
            oldDocument: documentData.origin,
            newDocument: "",
            title: `${documentData.type === 'document' ? 'Document' : 'Folder'} moved to folder ${folderData.origin}`,
            projectId: projectId,
            usersId: loggedUser.data.id,
        };

        putData(`/api/document/${documentData.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data.result, Status: documentData.status })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("danger", "Updating failed. Please try again")
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
        })
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.New.length > 0) {
            const sortedDocument = _.orderBy(document.New, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: "SET_DOCUMENT_LIST", list: sortedDocument, DocumentType: 'New', Count: document.NewCount, CountType: 'NewCount' })
        }
    }

    async viewDocument(data) {
        const { dispatch, loggedUser, folder, match } = this.props;
        const projectId = match.params.projectId;

        if (data.type !== 'folder') {
            if (data.document_read.length === 0) {
                const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 };
                await postData(`/api/document/read`, dataToSubmit, (ret) => {
                    dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: { ...data, document_read: [ret.data], isRead: 1 } });
                    dispatch({ type: 'UPDATE_DATA_DOCUMENT_LIST', UpdatedData: { ...data, document_read: [ret.data], isRead: 1 } })
                    $(`#documentViewerModal`).modal('show')
                });
            } else {
                console.log(data)
                dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
                $(`#documentViewerModal`).modal('show')
            }
        } else {
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' });
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data });
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedFolderName.concat([data]) });
                }
            });
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

    createFolder() {
        const { dispatch, folder } = { ...this.props }
        dispatch({ type: 'SET_SELECTED_FOLDER', Selected: { folderId: folder.Selected.id } })
    }

    downloadDocument(data) {
        if (data.type === 'document') {
            window.open(encodeURI(`/api/downloadDocument?fileName=${data.name}&origin=${data.origin}`));
        } else {
            window.open(encodeURI(`/api/downloadFolder?folder=${data.id}&folderName=${`${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`}`));
        }
    }

    render() {
        const { dispatch, document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        let tagCount = 0;

        return (
            <div class="mb20">
                {document.Filter.status === 'library' &&
                    <div class='selected-folder'>
                        <a href="javascript:void(0)" onClick={() => this.getFolderDocuments("")}>All Files</a>
                        {(folder.SelectedFolderName.length > 0) &&
                            folder.SelectedFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })
                        }
                    </div>
                }
                {document.Filter.status !== 'sort' ?
                    <div class="col-lg-12 col-md-12">
                        {(_.isEmpty(Count) === false) &&
                            <table class="table-document mb40">
                                <thead>
                                    <tr>
                                        <th scope="col" class="td-left" >File Name</th>
                                        <th scope="col">Uploaded By</th>
                                        <th scope="col">Upload Date</th>
                                        <th scope="col">Workstream</th>
                                        <th scope="col">Read On</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {document.Loading === "" &&
                                        _.orderBy(document.List, ['dateAdded'], ['desc']).map((data, index) => {
                                            const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`

                                            return (
                                                <tr key={index}>
                                                    <td class="document-name">
                                                        <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                                            {data.type === "folder" && <span class="fa fa-folder fa-lg read mr10"></span>}
                                                            {data.type === "folder" && <span class="read">{documentName}</span>}
                                                            {data.type === "document" && < span class={data.isRead ? 'read' : 'unread'}>{documentName}</span>}
                                                        </a>
                                                    </td>
                                                    <td class="avatar"><img src="/images/user.png" title={`${data.user.emailAddress}`} /></td>
                                                    <td>{displayDateMD(data.dateAdded)}</td>
                                                    <td>{
                                                        data.tagWorkstream.length > 0 &&
                                                        data.tagWorkstream.map((t, tIndex) => {
                                                            tagCount += t.label.length
                                                            let tempCount = tagCount;
                                                            if (tagCount > 16) { tagCount = 0 }
                                                            return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                                        })
                                                    }
                                                    </td>
                                                    <td>{data.isRead ? displayDateMD(data.document_read[0].dateUpdated) : '--'}</td>
                                                    <td>
                                                        <span class="document-action document-active" title="Download" onClick={() => this.downloadDocument(data)}><i class="fa fa-download fa-lg"></i></span>
                                                        {document.Filter.status === 'active' && <span class={`document-action ${data.isArchived ? 'document-archived' : 'document-active'}`} title="Archive"><i class="fa fa-archive fa-lg"></i></span>}
                                                        <span class="document-action document-active" title="Delete" data-toggle="modal" data-target="#deleteModal" onClick={() => dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data })}><i class="fa fa-trash fa-lg"></i></span>
                                                    </td>
                                                </tr>
                                            )

                                        })
                                    }

                                </tbody>

                            </table>
                        }
                        <div class="text-center">
                            {/* {_.isEmpty(folder.Selected) === false && document.List.length === 0 &&
                                <div class="d-block mb20">
                                    <a class="btn btn-default mr10" onClick={() => dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'Upload' })}>
                                        New File
                                    </a>
                                </div>
                            }
                            {(document.Filter.status !== 'active' && _.isEmpty(folder.Selected) === false) &&
                                <div class="d-block mb20">
                                    <button class="btn btn-default" data-toggle="modal" data-target="#folderModal">
                                        Create New Folder Here
                                 </button>
                                </div>
                            } */}
                            {
                                ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                            }
                        </div>
                        {
                            ((_.isEmpty(Count) === false) && document.Loading === "RETRIEVING") && <Loading />
                        }
                        {
                            (document.List.length === 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                        }

                    </div>
                    :
                    <DocumentSortFile />
                }
            </div>
        )
    }
}

export default withRouter(DocumentList);