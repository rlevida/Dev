import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";

let delayTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        project: store.project
    }
})

class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder, document } = this.props;
        if (_.isEqual(prevProps.document.Filter, this.props.document.Filter) == false) {
            clearTimeout(delayTimer);

            const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo, isArchived } = this.props.document.Filter;

            let requestUrl = ''
            if (document.ActiveTab === 'document') {
                requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`;
            } else {
                requestUrl = `/api/activityLogDocument?projectId=${project}&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`
            }
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'LibraryDocumentLoading' });

            delayTimer = setTimeout(() => {
                if (isCompleted) {
                    requestUrl += `&isCompleted=${isCompleted}`
                }
                if (search) {
                    requestUrl += `&search=${search}`
                }
                if (tags) {
                    _.map(tags, (t) => {
                        const tagType = t.value.split('-')[0];
                        const tagId = t.value.split('-')[1];
                        if (tagType === 'workstream') {
                            requestUrl += `&workstream=${tagId}`
                        }
                        if (tagType === 'task') {
                            requestUrl += `&task=${tagId}`
                        }
                    })
                }
                if (uploadedBy) {
                    requestUrl += `&uploadedBy=${uploadedBy}`
                }
                if (members) {
                    _.map(members, (e) => {
                        requestUrl += `&members=${e.value}`
                    })
                }
                if (uploadFrom) {
                    requestUrl += `&uploadFrom=${uploadFrom}`
                }
                if (uploadTo) {
                    requestUrl += `&uploadTo=${uploadTo}`
                }
                if (isArchived !== 'all') {
                    requestUrl += `&isArchived=${isArchived}`
                }

                getData(`${requestUrl}&status=new&folderId=${typeof folder.SelectedNewFolder.id !== 'undefined' ? folder.SelectedNewFolder.id : null}`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                        dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                        showToast('success', 'Documents successfully retrieved.')
                    } else {
                        showToast('success', 'Something went wrong!')
                    }
                });

                getData(`${requestUrl}&status=library&folderId=${typeof folder.SelectedNewFolder.id !== 'undefined' ? folder.SelectedNewFolder.id : null}`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                        dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                        showToast('success', 'Documents successfully retrieved.')
                    } else {
                        showToast('success', 'Something went wrong!')
                    }
                });

            }, 1000);
        }

        setDatePicker(this.handleDate, "uploadFrom", new Date(2019, 3, 20));
        setDatePicker(this.handleDate, "uploadTo", new Date(2019, 3, 20));
    }

    handleDate(e) {
        const { dispatch } = this.props;
        const selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY-MM-DD') : '';
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [e.target.name]: selectedDate } });
    }

    setDropDown(name, e) {
        const { dispatch, history, project, folder } = this.props;
        history.push(`/projects/${project.Selected.id}/files`);
        if (!_.isEmpty(folder.SelectedLibraryFolderName) || !_.isEmpty(folder.SelectedNewFolderName)) {
            dispatch({ type: 'CLEAR_FOLDER' })
        }
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: e }, name: name });
    }

    handleOnChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILTER', filter: { [e.target.name]: e.target.value } });
    }

    render() {
        const { dispatch, document } = this.props;
        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            <div class="flex-col">
                                <a class={document.Filter.isArchived === 'all' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('isArchived', 'all')}>All</a>
                                <a class={document.Filter.isArchived === 0 ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('isArchived', 0)}>Active Files</a>
                                <a class={document.Filter.isArchived === 1 ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('isArchived', 1)}>Archived</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
                            <a class="btn btn-default mr10" data-toggle="modal" data-target="#">
                                <span>
                                    <i class="fa fa-search fa-lg"></i>
                                </span>
                            </a>
                            <a class="btn btn-default mr10" data-toggle="modal" data-target="#">
                                <span>
                                    <i class="fa fa-download fa-lg"></i>
                                </span>
                            </a>
                            <a class="btn btn-default mr10" data-toggle="modal" data-target="#folderModal">
                                <span>
                                    <i class="fa fa-folder fa-lg"></i>
                                </span>
                            </a>
                            <a class="btn btn-default" onClick={() => dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'Upload' })}>
                                <span>
                                    <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                    Add New Files
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentFilter);