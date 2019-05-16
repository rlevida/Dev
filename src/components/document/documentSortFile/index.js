import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, putData, showToast } from '../../../globalFunction';
import DocumentContainer from './documentContainer';
import FolderContainer from './folderContainer';
import { connect } from "react-redux"
import { withRouter } from "react-router";
import DocumentViewerModal from "../modal/documentViewerModal"

const getFieldStyle = (isDragging, selected) => {
    const style = {
        borderStyle: 'dashed',
        borderWidth: 1,
        height: 30,
        margin: 5,
    };
    style.backgroundColor = selected ? 'pink' : '#87cefa';
    style.opacity = isDragging ? 0.5 : 1;
    return style;
};

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
        this.handleItemSelection = this.handleItemSelection.bind(this);
        this.handleSelectedFieldDragging = this.handleSelectedFieldDragging.bind(this);
    }

    componentWillMount() {
        this.state = { selectedFields: [], lastSelectedIndex: -1, selectedFieldsDragging: [] };
        // this.handleItemSelection(-1, false, false);
    }

    moveTo(folderOj, documentArr) {
        const { dispatch, loggedUser, match, document } = this.props;
        const projectId = match.params.projectId;

        const dataToSubmit = {
            documentIds: documentArr.map((e) => { return e.id }),
            data: {
                folderId: folderOj.id,
                projectId: projectId,
                usersId: loggedUser.data.id,
            }
        };

        putData(`/api/document/bulkUpdate/${folderOj.id}`, dataToSubmit, (c) => {
            const { result } = { ...c.data }
            dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST_BULK", list: result })
            showToast("success", "Successfully Updated.")
        })
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, match } = this.props;
        const projectId = match.params.projectId;
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=document`;

        if (ActiveTab === 'active' || document.ActiveTab === 'sort') {
            requestUrl += `&folderId=null&type=document`
        }

        if (ActiveTab === 'library') {
            requestUrl += `&folderId=null&type=folder`
        }

        if (ActiveTab === "archived") {
            requestUrl += `&isArchived=1`;
        } else {
            requestUrl += `&isArchived=0`;
        }

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

    handleItemSelection(index, cmdKey, shiftKey) {
        let selectedFields;
        const fields = this.props.document.List;
        const field = index < 0 ? '' : fields[index];
        const lastSelectedIndex = index;
        if (!cmdKey && !shiftKey) {
            selectedFields = [field];
        } else if (shiftKey) {
            if (this.state.lastSelectedIndex >= index) {
                selectedFields = [].concat.apply(this.state.selectedFields,
                    fields.slice(index, this.state.lastSelectedIndex));
            } else {
                selectedFields = [].concat.apply(this.state.selectedFields,
                    fields.slice(this.state.lastSelectedIndex + 1, index + 1));
            }
        } else if (cmdKey) {
            const foundIndex = this.state.selectedFields.findIndex(f => f === field);
            // If found remove it to unselect it.
            if (foundIndex >= 0) {
                selectedFields = [
                    ...this.state.selectedFields.slice(0, foundIndex),
                    ...this.state.selectedFields.slice(foundIndex + 1),
                ];
            } else {
                selectedFields = [...this.state.selectedFields, field];
            }
        }
        const finalList = fields ? fields
            .filter(f => selectedFields.find(a => a === f)) : [];
        this.setState({ selectedFields: finalList, lastSelectedIndex });
    }

    handleSelectedFieldDragging(fields) {
        this.setState({ selectedFieldsDragging: fields })
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
                                                            selectedFields={this.state.selectedFields}
                                                            handleSelection={this.handleItemSelection}
                                                            handleSelectedFieldDragging={this.handleSelectedFieldDragging}
                                                            selectedFieldsDragging={this.state.selectedFieldsDragging}
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
                                                    <FolderContainer
                                                        data={data}
                                                        moveTo={(folderObj, documentObj) => this.moveTo(folderObj, documentObj)}
                                                        key={index}
                                                        selectedFields={this.state.selectedFields}
                                                    />
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