import React from "react";
import LibraryContainer from "./libraryContainer";
import FieldContainer from "./FieldContainer";
import { getData, putData, showToast } from '../../../globalFunction';
import { withRouter } from "react-router";
import { connect } from "react-redux";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class DocumentLibrary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            order: 'asc',
        }
        this.fetchData = this.fetchData.bind(this);
        this.moveToLibrary = this.moveToLibrary.bind(this);
    }

    componentDidMount() {
        const { dispatch, document, loggedUser, location, match } = this.props;
        const projectId = match.params.projectId;
        const searchParams = new URLSearchParams(location.search);
        const folderId = searchParams.get("id");
        const folderStatus = searchParams.get("status")
        const folderOrigin = searchParams.get("folder")
        // automatically move to selected folder
        if (location.search !== "" && folderStatus === "library" && folderOrigin !== "") {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${folderId}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [{ id: folderId, name: folderOrigin }], Type: 'SelectedLibraryFolderName' });

                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        } else if (_.isEmpty(document.NewCount.Count)) {
            this.fetchData(1)
        }
    }

    editFolder(data, type) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type })
    }

    fetchData(page) {
        const { dispatch, document, loggedUser, folder, match } = this.props;
        const projectId = match.params.projectId;

        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=library&folderId=${(typeof folder.SelectedLibraryFolder.id !== 'undefined') ? folder.SelectedLibraryFolder.id : null}&starredUser=${loggedUser.data.id}`;
        const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo } = document.Filter;
        if (typeof isCompleted !== 'undefined' && isCompleted !== '') {
            requestUrl += `&isCompleted=${isCompleted}`
        }
        if (typeof search !== 'undefined' && search !== '') {
            requestUrl += `&search=${search}`
        }
        if (typeof tags !== 'undefined') {
            _.filter(tags, (t) => {
                const tagType = t.value.split('-')[0];
                const tagId = t.value.split('-')[1];
                if (tagType === 'workstream') {
                    requestUrl += `&workstream=${tagId}`
                }
            })
        }
        if (typeof uploadedBy !== 'undefined' && uploadedBy !== '') {
            requestUrl += `&uploadedBy=${uploadedBy}`
        }
        if (typeof members !== 'undefined' && members !== '') {
            _.map(members, (e) => {
                requestUrl += `&members=${e.value}`
            })
        }
        if (typeof uploadFrom !== 'undefined' && uploadFrom !== '') {
            requestUrl += `&uploadFrom=${uploadFrom}`
        }
        if (typeof uploadTo !== 'undefined' && uploadTo !== '') {
            requestUrl += `&uploadTo=${uploadTo}`
        }

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", list: document.Library.concat(c.data.result), DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })

                showToast('success', 'Documents successfully retrieved.');
            } else {
                showToast('error', 'Something went wrong!');
            }
        });
    }

    async getFolderDocuments(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedLibraryFolderName;
        if (data === '') {
            await dispatch({ type: "SET_DOCUMENT_LIST", list: [], DocumentType: 'Library', Count: { Count: { current_page : 0 , last_page : 0, total_count:0 }}, CountType: 'LibraryCount' })
            await dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [], Type: 'SelectedLibraryFolderName' });
            await dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {}, Type: 'SelectedLibraryFolder' })
            await this.fetchData(1)
            await history.push(`/projects/${projectId}/files`)

        }else if(folder.SelectedLibraryFolder.id !== data.id){
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'SET_DOCUMENT_LIST', list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedLibraryFolder' })

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
                        
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList, Type: 'SelectedLibraryFolderName' });
                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        }   
    }

    getNextResult() {
        let { document } = this.props;
        this.fetchData(document.LibraryCount.Count.current_page + 1)
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
            usersId: loggedUser.data.id
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

    moveToLibrary(data) {
        const { dispatch, document, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            id: data.id,
            status: "library",
            actionType: "moved",
            oldDocument: data.origin,
            newDocument: "",
            title: "Document moved to library",
            projectId: projectId,
            usersId: loggedUser.data.id,
            origin: data.origin,
            type: data.type,
            ...(data.folder !== null) ? { folderId: data.folderId } : {}
        }
        putData(`/api/document/${data.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                if (c.data.result.folderId == null) {
                    dispatch({ type: "MOVE_DOCUMENT_TO_LIBRARY", UpdatedData: c.data.result })
                }
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data.result, Status: data.status })
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: document.Status.new - 1 })
                dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'library', count: document.Status.library + 1 })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("error", "Updating failed. Please try again.")
            }
        })
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.Library.length > 0) {
            const sortedDocument = _.orderBy(document.Library, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: "SET_DOCUMENT_LIST", list: sortedDocument, DocumentType: 'Library', Count: document.LibraryCount, CountType: 'LibraryCount' })
        }
    }

    render() {
        const { document, folder } = this.props;
        const currentPage = (typeof document.LibraryCount.Count.current_page != "undefined") ? document.LibraryCount.Count.current_page : 1;
        const lastPage = (typeof document.LibraryCount.Count.last_page != "undefined") ? document.LibraryCount.Count.last_page : 1;

        return (
            <div>
                <div class="col-lg-12 col-md-12">
                    {folder.SelectedLibraryFolderName.length > 0 &&
                        <h3>
                            <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>Library</a>
                            {folder.SelectedLibraryFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })}
                        </h3>
                    }
                    <table class="table-document">
                        <tbody>
                            <tr>
                                <th style={{ width: '5%' }}></th>
                            </tr>
                            {(document.LibraryDocumentLoading != "RETRIEVING") &&
                              _.orderBy(document.Library, ['dateAdded'], ['desc']).map((data, index) => {
                                    return (
                                        <FieldContainer
                                            data={data}
                                            index={index}
                                            key={index}
                                            moveTo={(folderData, documentData) => this.moveTo(folderData, documentData)}
                                            moveToLibrary={(dataToMove) => this.moveToLibrary(dataToMove)}
                                        />
                                    )
                                })
                            }
                            <LibraryContainer
                                moveToLibrary={(data) => this.moveToLibrary(data)}
                            />
                        </tbody>
                    </table>
                    <div class="text-center">
                        {
                            ((currentPage != lastPage) && document.Library.length > 0 && document.LibraryDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentLibrary);