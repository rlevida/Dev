import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, postData, putData, showToast } from '../../../globalFunction';
import FieldContainer from './FieldContainer';

import { connect } from "react-redux"

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder
    }
})

export default class DocumentNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
            upload: false,
            loading: false,
            tags: [],
            files: [],
            folderAction: "",
            selectedFilter: 0,
            order: 'asc',
            selectedFolderName: []
        }
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        let { dispatch, document, loggedUser } = this.props;
        // automatically move to selected folder
        if (folderParams !== "" && folderParamsStatus === "new" && folderParamsOrigin !== "") {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${folderParams}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [{ id: folderParams, name: folderParamsOrigin }], Type: 'SelectedNewFolderName' });

                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        } else if (_.isEmpty(document.NewCount.Count)) {
            this.fetchData(1)
        }
    }

    addFolder() {
        let { loggedUser, folder, dispatch } = this.props;
        let { folderName } = this.state;
        let dataToSubmit = [
            {
                name: folderName,
                projectId: project,
                origin: folderName,
                createdBy: loggedUser.data.id,
                type: "folder",
                folderId: folder.SelectedNewFolder.id,
                project: project,
                uploadedBy: loggedUser.data.id,
                status: 'new'
            }
        ];

        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
            this.setState({ folderAction: "", folderName: "" });
        })
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder } = this.props;
        let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=new&folderId=${folder.SelectedNewFolder.id}&starredUser=${loggedUser.data.id}`;
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
        const { dispatch, loggedUser, folder } = this.props;
        let folderList = folder.SelectedNewFolderName
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
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
                if (data === '') {
                    window.history.replaceState({}, document.title, "/project/" + `${project}/documents`);
                }
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList, Type: 'SelectedNewFolderName' });
                showToast('success', 'Documents successfully retrieved.');
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    getNextResult() {
        let { document, dispatch } = this.props;
        this.fetchData(document.NewCount.Count.current_page + 1)
    }

    moveTo(folderData, documentData) {
        let { dispatch, loggedUser } = this.props;
        let dataToSubmit = {
            status: folderData.status,
            folderId: folderData.id,
            actionType: "moved",
            oldDocument: documentData.origin,
            newDocument: "",
            title: `${documentData.type === 'document' ? 'Document' : 'Folder'} moved to folder ${folderData.origin}`,
            projectId: project,
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
        let { document, folder } = this.props
        const currentPage = (typeof document.NewCount.Count.current_page != "undefined") ? document.NewCount.Count.current_page : 1;
        const lastPage = (typeof document.NewCount.Count.last_page != "undefined") ? document.NewCount.Count.last_page : 1;

        return <div class="mb20">
            <div class="col-lg-12 col-md-12">
                <h3>
                    <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>New Documents</a>
                    {folder.SelectedNewFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.origin}</a> </span> })}
                </h3>

                {(this.state.folderAction == "") &&
                    <div class="row mb10">
                        <div class="col-lg-2">
                            <div class="col-md-4 mb5">
                                <div class="mt20">
                                    <a href="javascript:void(0)" title="New Folder" style={{ textDecoration: "none" }} onClick={() => this.setState({ folderAction: "create" })}><span class="fa fa-folder fa-3x"></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {(this.state.folderAction == "create") &&
                    <form class="form-inline">
                        <div class="form-group">
                            <input class="form-control" type="text" name="folderName" placeholder="Enter folder name" onChange={(e) => this.setState({ [e.target.name]: e.target.value })} value={this.state.folderName} />
                            <a href="javascript:void(0)" class="btn btn-primary" style={{ margin: "5px" }} onClick={() => this.addFolder()}>Add</a>
                            <a href="javascript:void(0)" class="btn btn-primary" style={{ margin: "5px" }} onClick={() => this.setState({ folderAction: "" })}>Cancel</a>
                        </div>
                    </form>
                }
                <table id="dataTable" class="table responsive-table table-bordered document-table" ref={el => (this.componentRef = el)}>
                    <tbody>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('dateAdded')}>Uploaded</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                        {(document.NewDocumentLoading != "RETRIEVING") &&
                            document.New.map((data, index) => {
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
                <div class="text-center">
                    {
                        ((currentPage != lastPage) && document.New.length > 0 && document.NewDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                    }
                    {
                        (document.New.length == 0 && document.NewDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (document.NewDocumentLoading == "RETRIEVING") && <Loading />
                }
            </div>
        </div>
    }
}