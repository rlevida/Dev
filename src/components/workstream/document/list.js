import React from "react";
import { displayDate, getData } from '../../../globalFunction';
import { DropDown, Loading } from "../../../globalComponents";
import EditModal from "./editModal"
import DocumentViewerModal from "./documentViewerModal"
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
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
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.handleChange = this.handleChange.bind(this)
        this.fetchData = this.fetchData.bind(this)
        this.getNextResult = this.getNextResult.bind(this)
    }

    componentDidMount() {
        let { dispatch, document } = this.props

        getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project}`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
        })

        getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project}`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
        })

        if (_.isEmpty(document.Count)) {
            this.fetchData(1)
        }
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, workstream } = this.props;
        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project}&linkType=workstream&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstreamId=${workstream.Selected.id}&tagType=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_LIST", list: document.List.concat(c.data.result), DocumentType: 'List', Count: c.data.count, CountType: 'Count' })
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' })
        });
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } });
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data: { id: id, active: (active == 1) ? 0 : 1 } });
    }

    deleteDocument(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_DOCUMENT", { id: id });
        }
    }

    archiveData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to archive this record?")) {
            socket.emit("ARCHIVE_DOCUMENT", { id: id });
        }
    }

    saveDocument() {
        let { socket, document, workstream } = this.props;
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", {
            data: document.Selected,
            filter: { tagTypeId: document.Selected.id, tagType: "document" },
            type: "workstream",
            linkId: workstream.Selected.id,
            linkType: "workstream",
            tagType: "document"
        })
    }

    viewDocument(data) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
        $(`#documentViewerModal`).modal('show')
    }

    handleIsCompleted(data, value) {
        let { socket, document } = this.props;
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data: { id: data.id, isCompleted: !value } });
    }

    starDocument(data, isStarred) {
        let { socket, loggedUser } = this.props;
        if (isStarred) {
            socket.emit("DELETE_STARRED", { id: data.id });
        } else {
            socket.emit("SAVE_STARRED", { data: { usersId: loggedUser.data.id, linkType: "project", linkId: data.id } });
        }
    }

    handleChange(e) {
        let { socket, dispatch, document } = this.props
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
        let { dispatch, folder } = this.props;
        if (data.id != null) {
            let documentFolder = folder.List.filter(e => {
                return e.id == data.folderId
            })
            let folderParams = ""
            if (data.folderId) {
                folderParams = `?folder=${data.folderId}&type=${data.status}`
            }
            window.location.replace(`/project/documents/${project}` + folderParams);
        }
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    getNextResult() {
        let { document } = this.props;
        this.fetchData(document.Count.current_page + 1)
    }

    editDocument(data, type) {
        let { dispatch } = this.props;
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
        let { document, starred } = this.props;
        let tagCount = 0;
        const currentPage = (typeof document.Count.current_page != "undefined") ? document.Count.current_page : 1;
        const lastPage = (typeof document.Count.last_page != "undefined") ? document.Count.last_page : 1;
        return <div>
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
                                                {starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                    ? <span class="glyphicon glyphicon-star" onClick={() => this.starDocument(data, 1)} style={{ cursor: "pointer" }}></span>
                                                    : <span class="glyphicon glyphicon-star-empty" onClick={() => this.starDocument(data, 0)} style={{ cursor: "pointer" }}></span>
                                                }
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
                                                        <li>{starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                            ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={() => this.starDocument(data, 1)}>Unstarred</a>
                                                            : <a href="javascript:void(0)" data-tip="Star" onClick={() => this.starDocument(data, 0)}>Star</a>
                                                        }
                                                        </li>
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
    }
}