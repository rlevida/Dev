import React from "react";
import { displayDate, getData, postData, showToast } from '../../../globalFunction';
import { Loading } from "../../../globalComponents";
import EditModal from "./editModal"
import DocumentViewerModal from "./documentViewerModal"
import { connect } from "react-redux"
@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users: store.users,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        folder: store.folder

    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
            upload: false,
            loading: false,
            tags: [],
            files: [],
            sort: 'asc'
        }
        this.handleChange = this.handleChange.bind(this)
        this.fetchData = this.fetchData.bind(this)
        this.getNextResult = this.getNextResult.bind(this)
    }

    componentDidMount() {
            console.log(`here`)
        // let { dispatch, document } = this.props

        // getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project}`, {}, (c) => {
        //     dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
        // })

        // getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project}`, {}, (c) => {
        //     dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
        // })

        // if (_.isEmpty(document.Count)) {
        //     this.fetchData(1)
        // }
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, workstream } = this.props;
        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project}&linkType=workstream&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstreamId=${workstream.Selected.id}&tagType=document&starredUser=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_LIST", list: document.List.concat(c.data.result), DocumentType: 'List', Count: c.data.count, CountType: 'Count' })
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' })
        });
    }

    viewDocument(data) {
        let { dispatch } = this.props;
        getData(`/api/conversation/getConversationList?linkType=document&linkId=${data.id}`, {}, (c) => {
            dispatch({ type: 'SET_COMMENT_LIST', list: c.data })
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
            $(`#documentViewerModal`).modal('show')
        })
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch } = this.props;
        const isStarredValue = (isStarred > 0) ? 0 : 1;
        postData(`/api/starred?projectId=${project}&document=${origin}`, {
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
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, DocumentType: 'List' });
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    handleChange(e) {
        let { dispatch, document } = this.props
        let Selected = Object.assign({}, document.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    selectTag(e, data) {
        let { dispatch, document } = this.props;
        let Selected = Object.assign({}, document.Selected);
        Selected["tags"] = JSON.stringify(e)
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    goToFolder(data) {
        if (data.document_folder) {
            folderParams = `?folder=${data.document_folder.id}&status=${data.document_folder.status}&origin=${data.document_folder.origin}`
        }
        window.location.replace(`/project/${project}/documents` + folderParams);
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    getNextResult() {
        const { document } = this.props;
        this.fetchData(document.Count.current_page + 1)
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        let newData = { ...data };

        newData = { ...data, tags: JSON.stringify(data.tags) }
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: newData });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.List.length > 0) {
            const sortedDocument = _.orderBy(document.List, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: "SET_DOCUMENT_LIST", list: sortedDocument, DocumentType: 'List', Count: document.Count, CountType: 'Count' })
        }
    }

    render() {
        const { document } = this.props;
        let tagCount = 0;
        const currentPage = (typeof document.Count.current_page != "undefined") ? document.Count.current_page : 1;
        const lastPage = (typeof document.Count.last_page != "undefined") ? document.Count.last_page : 1;

        return (
            <div>
                <div class="row">
                    <div class="col-lg-12 col-md-12">
                        <h3 class="m0">Documents</h3>
                        <table id="dataTable" class="table responsive-table table-bordered document-table mt30">
                            <tbody>
                                <tr>
                                    <th></th>
                                    <th></th>
                                    <th><a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                                    <th><a href="javascript:void(0)" onClick={() => this.sortDocument('dateAdded')}>Uploaded date</a></th>
                                    <th>Uploaded by</th>
                                    <th>Tags</th>
                                    <th></th>
                                </tr>
                                {(document.Loading != "RETRIEVING") &&
                                    document.List.map((data, index) => {
                                        let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <input type="checkbox"
                                                    />
                                                </td>
                                                <td>
                                                    <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                                        <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                                                    </a>
                                                </td>
                                                <td class="new-document"> <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}><span class={data.type !== "folder" ? 'glyphicon glyphicon-file' : 'fa fa-folder'}></span>{documentName}</a></td>
                                                <td>{displayDate(data.dateAdded)}</td>
                                                <td>{data.user.emailAddress}</td>
                                                <td>
                                                    {(data.tags.length > 0) &&
                                                        data.tags.map((t, tIndex) => {
                                                            tagCount += t.label.length
                                                            let tempCount = tagCount;
                                                            if (tagCount > 16) { tagCount = 0 }
                                                            return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                                        })
                                                    }
                                                </td>
                                                <td>
                                                    <div class="dropdown">
                                                        <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                            <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(data)}>Download</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Rename" onClick={() => this.editDocument(data, "rename")}>Rename</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Edit tags" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                                            <li><a href="javascript:void(0)" data-tip="Goto folder" onClick={() => this.goToFolder(data)}>Go to folder</a></li>
                                                        </ul>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }

                            </tbody>
                        </table>
                        <div class="text-center">
                            {
                                ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                            }
                            {
                                (document.List.length == 0 && document.Loading != "RETRIEVING") && <p>No Records Found</p>
                            }
                        </div>
                        {
                            (document.Loading == "RETRIEVING") && <Loading />
                        }
                    </div>
                </div>
                <EditModal />
                <DocumentViewerModal />
            </div>
        )
    }
}