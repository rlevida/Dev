import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, putData, showToast } from '../../../globalFunction';
import DocumentContainer from './documentContainer';
import FolderContainer from './folderContainer';
import { connect } from "react-redux"
import { withRouter } from "react-router";
import DocumentViewerModal from "../modal/documentViewerModal"

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

    fetchData(page) {
        const { dispatch, loggedUser, document, folder, match } = this.props;
        const projectId = match.params.projectId;
        const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo, status } = document.Filter;

        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=document`;
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
            dispatch({ type: 'SET_DOCUMENT_LIST', list: document.List.concat(result), count: count });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' });
        });
    }

    getNextResult() {
        const { document } = this.props;
        this.fetchData(document.Count.current_page + 1)
    }

    render() {
        const { document, folder } = { ...this.props };
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
                    {
                        (document.Loading === "") &&
                            <div class="col-lg-4 col-md-6">
                                <div class="card-header">
                                    <h4>Library</h4>
                                </div>
                                <div class="card-body m0">
                                    <div id="library">
                                        {
                                            ((folder.List).length > 0) && <div>
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
                    }

                </div>
                <DocumentViewerModal />
            </div>
        )
    }
}

export default withRouter(DocumentNew);