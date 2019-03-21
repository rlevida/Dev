import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, postData, putData, showToast, getParameterByName } from '../../../globalFunction';
import FieldContainer from './FieldContainer';
import { connect } from "react-redux"
import { withRouter } from "react-router";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class DocumentNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            order: 'asc',
        }
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { dispatch, document, loggedUser, location, match } = this.props;
        const projectId = match.params.projectId;
        const searchParams = new URLSearchParams(location.search);
        const folderId = searchParams.get("id");
        const folderStatus = searchParams.get("status")
        const folderOrigin = searchParams.get("folder")

        // automatically move to selected folder
        if (location.search !== "" && folderStatus === "new" && folderOrigin !== "") {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${folderId}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [{ id: folderId, name: folderOrigin }], Type: 'SelectedNewFolderName' });

                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        } else if (_.isEmpty(document.NewCount.Count)) {
            this.fetchData(1)
        }
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder, match } = this.props;
        const projectId = match.params.projectId;
        const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo } = document.Filter;

        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=new&folderId=${(typeof folder.SelectedNewFolder.id !== 'undefined') ? folder.SelectedNewFolder.id : null}&starredUser=${loggedUser.data.id}`;

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
        if (typeof uploadFrom !== 'undefiend' && uploadFrom !== '') {
            requestUrl += `&uploadFrom=${uploadFrom}`
        }
        if (typeof uploadTo !== 'undefiend' && uploadTo !== '') {
            requestUrl += `&uploadTo=${uploadTo}`
        }

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", list: document.New.concat(c.data.result), DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                showToast('success', 'Documents successfully retrieved.')
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    getFolderDocuments(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedNewFolderName;
        
        if (data === "") {
            history.push(`/projects/${projectId}/files`)
            this.fetchData(1)
        } else {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedNewFolder' })

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

                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList, Type: 'SelectedNewFolderName' });
                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
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

    render() {
        const { document, folder } = this.props
        const currentPage = (typeof document.NewCount.Count.current_page != "undefined") ? document.NewCount.Count.current_page : 1;
        const lastPage = (typeof document.NewCount.Count.last_page != "undefined") ? document.NewCount.Count.last_page : 1;

        return (
            <div class="mb20">
                <div class="col-lg-12 col-md-12">
                    <h3>
                        <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>New</a>
                        {folder.SelectedNewFolderName.map((e, index) => { return <span key={index}> <i class="fa fa-chevron-right" style={{ fontSize: '16px' }}></i><a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })}
                    </h3>
                    {
                        (document.NewDocumentLoading != "RETRIEVING" && document.New.length > 0) && <table class="table-document mb40">
                            <thead>
                                <tr>
                                    <th style={{ width: '5%' }}></th>
                                    <th scope="col" class="td-left" >File Name</th>
                                    <th scope="col">Uploaded By</th>
                                    <th scope="col">Upload Date</th>
                                    <th scope="col">Workstream</th>
                                    <th scope="col">Read On</th>
                                    <th scope="col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.orderBy(document.New, ['dateAdded'], ['desc']).map((data, index) => {
                                        return (
                                            <FieldContainer
                                                data={data}
                                                index={index}
                                                key={index}
                                                moveTo={(folderData, documentData) => this.moveTo(folderData, documentData)}
                                            />
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    }
                    <div class="text-center">
                        {
                            ((currentPage != lastPage) && document.New.length > 0 && document.NewDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                        }
                    </div>
                    {
                        (document.NewDocumentLoading == "RETRIEVING") && <Loading />
                    }
                    {
                        (document.New.length == 0 && document.NewDocumentLoading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentNew);