import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, putData, showToast } from "../../../globalFunction";
import DocumentContainer from "./documentContainer";
import FolderContainer from "./folderContainer";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import DocumentViewerModal from "../modal/documentViewerModal";

const getFieldStyle = (isDragging, selected) => {
    const style = {
        borderStyle: "dashed",
        borderWidth: 1,
        height: 30,
        margin: 5
    };
    style.backgroundColor = selected ? "pink" : "#87cefa";
    style.opacity = isDragging ? 0.5 : 1;
    return style;
};

@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder
    };
})
class DocumentNew extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            order: "asc"
        };
        this.handleItemSelection = this.handleItemSelection.bind(this);
        this.handleSelectedFieldDragging = this.handleSelectedFieldDragging.bind(this);
    }

    componentWillMount() {
        this.state = { selectedFieldsDragging: [] };
    }

    moveTo(folderOj, documentArr) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED_FIELDS", Selected: documentArr });
        dispatch({ type: "SET_FOLDER_SELECTED", Selected: folderOj });
        this.setState({ selectedFieldsDragging: [] });
        $(`#confirmationModal`).modal("show");
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, match } = this.props;
        const projectId = match.params.projectId;
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=document`;

        if (ActiveTab === "active" || document.ActiveTab === "sort") {
            requestUrl += `&folderId=null&type=document`;
        }

        if (ActiveTab === "library") {
            requestUrl += `&folderId=null&type=folder`;
        }

        if (ActiveTab === "archived") {
            requestUrl += `&isArchived=1`;
        } else {
            requestUrl += `&isArchived=0`;
        }

        getData(requestUrl, {}, c => {
            const { count, result } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: document.List.concat(result), count: count });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }

    getNextResult() {
        const { document } = this.props;
        this.fetchData(document.Count.current_page + 1);
    }

    handleItemSelection(index, cmdKey, shiftKey, ctrlKey) {
        const { dispatch, document } = { ...this.props };
        let selectedFields;
        const fields = document.List;
        const field = index < 0 ? "" : fields[index];
        const lastSelectedIndex = index;
        if (!cmdKey && !shiftKey && !ctrlKey) {
            selectedFields = [field];
        } else if (shiftKey) {
            if (document.LastSelectedIndex >= index) {
                selectedFields = [].concat.apply(document.SelectedFields, fields.slice(index, document.LastSelectedIndex));
            } else {
                selectedFields = [].concat.apply(document.SelectedFields, fields.slice(document.LastSelectedIndex + 1, index + 1));
            }
        } else if (cmdKey || ctrlKey) {
            const foundIndex = document.SelectedFields.findIndex(f => f === field);
            // If found remove it to unselect it.
            if (foundIndex >= 0) {
                selectedFields = [...document.SelectedFields.slice(0, foundIndex), ...document.SelectedFields.slice(foundIndex + 1)];
            } else {
                selectedFields = [...document.SelectedFields, field];
            }
        }
        const finalList = fields ? fields.filter(f => selectedFields.find(a => a === f)) : [];
        dispatch({ type: "SET_DOCUMENT_SELECTED_FIELDS", Selected: finalList, LastSelectedIndex: lastSelectedIndex });
    }

    handleSelectedFieldDragging(fields) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_FIELDS_DRAGGING", Fields: fields });
    }

    render() {
        const { document, folder } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = typeof Count.current_page != "undefined" ? Count.current_page : 1;
        const lastPage = typeof Count.last_page != "undefined" ? Count.last_page : 1;

        return (
            <div class={document.Loading == "RETRIEVING" && document.List.length == 0 ? "linear-background" : ""}>
                <div class="row">
                    <div class="col-lg-8 col-md-6">
                        <div class="card-header">{document.Loading === "" && <h4>Active Files</h4>}</div>
                        <div class="card-body m0">
                            {document.List.length > 0 && (
                                <div>
                                    <table class="table-document" id="activeFiles">
                                        <thead>
                                            <tr>
                                                <th scope="col" class="td-left">
                                                    File Name
                                                </th>
                                                <th scope="col">Uploaded By</th>
                                                <th scope="col">Upload Date</th>
                                                <th scope="col">Workstream</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {document.Loading === "" &&
                                                (document.List).map((data, index) => {
                                                    return (
                                                        <DocumentContainer
                                                            data={data}
                                                            index={index}
                                                            key={index}
                                                            moveTo={(folderData, documentData) => this.moveTo(folderData, documentData)}
                                                            handleSelection={this.handleItemSelection}
                                                            handleSelectedFieldDragging={this.handleSelectedFieldDragging}
                                                        />
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                    {currentPage != lastPage && document.List.length > 0 && document.Loading != "RETRIEVING" && (
                                        <p class="mb0 text-center">
                                            <a onClick={() => this.getNextResult()}>Load More Documents</a>
                                        </p>
                                    )}
                                    {_.isEmpty(Count) === false && document.Loading === "RETRIEVING" && <Loading />}
                                </div>
                            )}
                            {document.List.length === 0 && document.Loading != "RETRIEVING" && (
                                <p class="mb0 text-center">
                                    <strong>No Records Found</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    {document.Loading === "" && (
                        <div class="col-lg-4 col-md-6">
                            <div class="card-header">
                                <h4>Library</h4>
                            </div>
                            <div class="card-body m0">
                                <div id="library">
                                    {folder.List.length > 0 && (
                                        <div>
                                            {_.orderBy(folder.List, ["dateAdded"], ["desc"]).map((data, index) => {
                                                return <FolderContainer data={data} moveTo={(folderObj, documentObj) => this.moveTo(folderObj, documentObj)} key={index} selectedFields={this.state.selectedFields} />;
                                            })}
                                        </div>
                                    )}
                                    {folder.List.length === 0 && document.Loading != "RETRIEVING" && (
                                        <p class="mb0 text-center">
                                            <strong>No Records Found</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <DocumentViewerModal />
            </div>
        );
    }
}

export default withRouter(DocumentNew);
