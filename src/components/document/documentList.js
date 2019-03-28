import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, getParameterByName, displayDateMD } from '../../globalFunction';

import { connect } from "react-redux"
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';

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
        this.state = {
            order: 'asc',
        }
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        // const { dispatch, document, loggedUser, location, match } = this.props;
        // const projectId = match.params.projectId;
        // const searchParams = new URLSearchParams(location.search);
        // const folderId = searchParams.get("id");
        // const folderStatus = searchParams.get("status")
        // const folderOrigin = searchParams.get("folder")

        // // automatically move to selected folder
        // if (location.search !== "" && folderStatus === "new" && folderOrigin !== "") {
        //     getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${folderId}&starredUser=${loggedUser.data.id}`, {}, (c) => {
        //         if (c.status == 200) {
        //             dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
        //             dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
        //             dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [{ id: folderId, name: folderOrigin }], Type: 'SelectedNewFolderName' });

        //             showToast('success', 'Documents successfully retrieved.');
        //         } else {
        //             showToast('success', 'Something went wrong!')
        //         }
        //     });
        // } else if (_.isEmpty(document.NewCount.Count)) {
        this.fetchData(1)
        // }
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
            // if (c.status == 200) {
            //     dispatch({ type: "SET_DOCUMENT_LIST", list: document.New.concat(c.data.result), DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
            //     dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
            //     dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
            //     showToast('success', 'Documents successfully retrieved.')
            // } else {
            //     showToast('success', 'Something went wrong!')
            // }
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

    viewDocument(data) {
        const { dispatch, loggedUser, folder, match } = this.props;
        const projectId = match.params.projectId;

        if (data.type !== 'folder') {
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
        } else {
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' });
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data });
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedFolderName.concat([data]) });
                    showToast('success', 'Documents successfully retrieved.');
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

    render() {
        const { document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        const projectId = match.params.projectId;
        let tagCount = 0;

        return (
            <div class="mb20">
                <div class='selected-folder'>
                    {document.Filter.status === 'library' && <a href="javascript:void(0)" onClick={() => this.getFolderDocuments("")}>All Files</a>}
                    {(folder.SelectedFolderName.length > 0) &&
                        folder.SelectedFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })
                    }
                </div>
                {document.Filter.status !== 'sort' ?
                    <div class="col-lg-12 col-md-12">
                        {(_.isEmpty(Count) === false) &&
                            <table class="table-document mb40">
                                <thead>
                                    <tr>
                                        {/* <th scope="col" style={{ width: '5%' }}></th> */}
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
                                                    {/* <td>
                                                        <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                                            <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                                                        </a>
                                                    </td> */}
                                                    <td class="document-name">
                                                        {data.type === "document" ?
                                                            <Link to={`/projects/${projectId}/files/${data.id}`}><span class={data.isRead ? 'read' : 'unread'}>{documentName}</span></Link>
                                                            :
                                                            <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                                                <span class="fa fa-folder fa-lg read mr10"></span>
                                                                <span class="read">{documentName}</span>
                                                            </a>
                                                        }
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
                                                </tr>

                                            )
                                        })
                                    }

                                </tbody>
                            </table>
                        }
                        <div class="text-center">
                            {
                                ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                            }
                        </div>
                        {
                            ((_.isEmpty(Count) === false) && document.Loading === "RETRIEVING") && <Loading />
                        }
                        {/* {
                            (_.isEmpty(folder.Selected) === false) &&
                            <div class="create-folder">
                                <p class="mb0 text-center" onClick={() => this.createFolder()}><strong>Create Folder</strong></p>
                            </div>
                        } */}
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