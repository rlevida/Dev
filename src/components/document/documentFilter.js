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
    }
})

class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "setDropDown",
            "handleDate",
            "handleOnChange"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder, document, match } = this.props;
        const projectId = match.params.projectId;



        if (_.isEqual(prevProps.document.Filter, this.props.document.Filter) == false) {
            clearTimeout(delayTimer);

            if (_.isEmpty(folder.Selected) === false) {
                dispatch({ type: "SET_SELECTED_FOLDER", Selected: {} })
                dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] })
            }

            const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo, isArchived, status } = this.props.document.Filter;

            let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

            // let requestUrl = `/api/document?isDeleted=0&1linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;


            // if (document.ActiveTab === 'document') {
            //     requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;
            // } else {
            //     requestUrl = `/api/activityLogDocument?projectId=${projectId}&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`
            // }

            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });

            delayTimer = setTimeout(() => {
                if (status === 'active' || status === 'sort') {
                    requestUrl += `&folderId=null&type=document`
                }

                if (status === 'library') {
                    requestUrl += `&folderId=null&type=folder`
                }

                // if (isCompleted) {
                //     requestUrl += `&isCompleted=${isCompleted}`
                // }
                // if (search) {
                //     requestUrl += `&search=${search}`
                // }
                // if (tags) {
                //     _.map(tags, (t) => {
                //         const tagType = t.value.split('-')[0];
                //         const tagId = t.value.split('-')[1];
                //         if (tagType === 'workstream') {
                //             requestUrl += `&workstream=${tagId}`
                //         }
                //         if (tagType === 'task') {
                //             requestUrl += `&task=${tagId}`
                //         }
                //     })
                // }
                // if (uploadedBy) {
                //     requestUrl += `&uploadedBy=${uploadedBy}`
                // }
                // if (members) {
                //     _.map(members, (e) => {
                //         requestUrl += `&members=${e.value}`
                //     })
                // }
                // if (uploadFrom) {
                //     requestUrl += `&uploadFrom=${uploadFrom}`
                // }
                // if (uploadTo) {
                //     requestUrl += `&uploadTo=${uploadTo}`
                // }
                getData(`${requestUrl}`, {}, (c) => {
                    const { result, count } = { ...c.data }
                    dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' })

                });

                if (status === 'sort') {
                    getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder&folderId=null`, {}, (c) => {
                        const { result, count } = { ...c.data }
                        dispatch({ type: "SET_FOLDER_LIST", list: result, count: count })
                    });
                }
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
        const { dispatch, history, match, folder } = this.props;
        const projectId = match.params.projectId;

        history.push(`/projects/${projectId}/files`);
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
                                <a class={document.Filter.status === 'active' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'active')}>Active Files</a>
                                <a class={document.Filter.status === 'library' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'library')}>Library</a>
                                <a class={document.Filter.status === 'sort' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'sort')}>Sort Files</a>
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
                            <a class="btn btn-default mr10" onClick={() => dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'Upload' })}>
                                <span>
                                    <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                    New File
                                </span>
                            </a>
                            {
                                (document.Filter.status !== 'active') &&
                                <a class="btn btn-default" data-toggle="modal" data-target="#folderModal">
                                    <span>
                                        <i class="fa fa-folder fa-lg mr5"></i>
                                        New Folder
                                    </span>
                                </a>
                            }

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentFilter);