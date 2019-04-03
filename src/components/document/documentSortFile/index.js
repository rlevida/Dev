import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, postData, putData, showToast, getParameterByName } from '../../../globalFunction';
import DocumentContainer from './documentContainer';
import FolderContainer from './folderContainer';
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
    }

    componentDidMount() {
        const self = this;
        window.addEventListener('click', function (e) {
            const { dispatch, folder } = { ...self.props }
            if (!document.getElementById('library').contains(e.target)) {
                if (typeof folder.Selected !== "undefined") {
                    dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} })
                }
            }
        });
    }

    async fetchFolder(data) {
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
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&type=folder&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
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

                let isSelectedFolder = true;
                let newList = []
                while (isSelectedFolder) {
                    newList = folder.List.map((a) => {
                        if (a.id === data.id) {
                            if (typeof a.childFolder === 'undefined') {
                                a.childFolder = []
                                a.childFolder = result;
                                isSelectedFolder = false;
                            } else {
                                a.childFolder.map((b) => {
                                    if (b.id === data.id) {
                                        if (typeof b.childFolder === 'undefined') {
                                            b.childFolder = []
                                            b.childFolder = result
                                            isSelectedFolder = false;
                                        }
                                    }
                                    return b
                                })
                            }
                        }
                        return a
                    })
                }
                dispatch({ type: 'SET_FOLDER_LIST', list: newList })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data })
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList });
            });
        }
    }

    moveTo(folderOj, documentObj) {
        const { dispatch, loggedUser, match, document } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            origin: documentObj.origin,
            status: folderOj.status,
            folderId: folderOj.id,
            projectId: projectId,
            usersId: loggedUser.data.id,
        };

        putData(`/api/document/${documentObj.id}`, dataToSubmit, (c) => {
            const { result } = { ...c.data }
            dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: result })
            showToast("success", "Successfully Updated.")
        })
    }

    renderFolder(data) {

        return (
            <div id={data.id}>
                <p>
                    <a class="btn btn-primary" data-toggle="collapse" href="#collapseExample" role="button" aria-expanded="false" aria-controls="collapseExample" onClick={() => this.fetchFolder(data)}>
                        {data.origin}
                    </a>
                </p>
                <div class="collapse" id="collapseExample">
                    <div class="collapse-folder-child">
                        {typeof data.childFolder !== "undefined" && data.childFolder.length > 0 &&
                            data.childFolder.map(e => { return this.renderFolder(e) })
                        }
                    </div>
                </div>

            </div>
        )
    }

    render() {
        const { document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;

        return (
            <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}>
                <div class="row">
                    <div class="col-lg-8 col-md-6">
                        <div class="card-header">
                            {
                                (document.Loading === "") && <h4>Active Files</h4>
                            }
                        </div>
                        <div class="card-body m0">
                            {
                                ((document.List).length > 0) && <div>
                                    <table class="table-document" id="activeFiles">
                                        <thead>
                                            <tr>
                                                <th scope="col" class="td-left" >File Name</th>
                                                <th scope="col">Uploaded By</th>
                                                <th scope="col">Upload Date</th>
                                                <th scope="col">Workstream</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {document.Loading === "" &&
                                                _.orderBy(document.List, ['dateAdded'], ['desc']).map((data, index) => {
                                                    return (
                                                        <DocumentContainer
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
                                    {
                                        ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Documents</a></p>
                                    }
                                    {
                                        ((_.isEmpty(Count) === false) && document.Loading === "RETRIEVING") && <Loading />
                                    }
                                    {
                                        (document.List.length === 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                    <div class="col-lg-4 col-md-6">
                        <div class="card-header">
                            {
                                (document.Loading === "") && <h4>Library</h4>
                            }
                        </div>
                        <div class="card-body m0">
                            <div id="library">
                                {
                                    ((document.List).length > 0) && <div>
                                        {_.orderBy(folder.List, ['dateAdded'], ['desc']).map((data, index) => {
                                            return (
                                                <FolderContainer data={data} moveTo={(folderObj, documentObj) => this.moveTo(folderObj, documentObj)} key={index} />
                                            )
                                        })}
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentNew);