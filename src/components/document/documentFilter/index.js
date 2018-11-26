import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { DropDown } from "../../../globalComponents";
import { getData, showToast } from "../../../globalFunction";

let delayTimer = "";

@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document
    }
})

export default class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
    }

    setDropDown(name, e) {
        const { dispatch, loggedUser } = this.props;
        let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`;

        clearTimeout(delayTimer);
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: e }, name: name });
        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' });
        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'LibraryDocumentLoading' });

        delayTimer = setTimeout(() => {
            const { document } = this.props;
            if (typeof document.Filter.isCompleted !== 'undefined' && document.Filter.isCompleted !== '') {
                requestUrl += `&isCompleted=${document.Filter.isCompleted}`
            }
            if (typeof document.Filter.search !== 'undefined' && document.Filter.search !== '') {
                requestUrl += `&search=${document.Filter.search}`
            }
            if (typeof document.Filter.tags !== 'undefined') {
                _.filter(document.Filter.tags, (t) => {
                    const tagType = t.value.split('-')[0];
                    const tagId = t.value.split('-')[1];
                    if (tagType === 'workstream') {
                        requestUrl += `&workstream=${tagId}`
                    }
                })
            }
            getData(`${requestUrl}&status=new`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    showToast('success', 'Documents successfully retrieved.')
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
            getData(`${requestUrl}&status=library`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    showToast('success', 'Documents successfully retrieved.')
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        }, 1000);
    }

    handleOnChange(e) {
        const { dispatch, loggedUser, document } = this.props;
        let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`;

        clearTimeout(delayTimer);
        dispatch({ type: 'SET_DOCUMENT_FILTER', filter: { [e.target.name]: e.target.value } });
        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' });
        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'LibraryDocumentLoading' });

        delayTimer = setTimeout(() => {
            const { document } = this.props;
            if (typeof document.Filter.isCompleted !== 'undefined' && document.Filter.isCompleted !== '') {
                requestUrl += `&isCompleted=${document.Filter.isCompleted}`
            }
            if (typeof document.Filter.search !== 'undefined' && document.Filter.search !== '') {
                requestUrl += `&search=${document.Filter.search}`
            }
            if (typeof document.Filter.tags !== 'undefined') {
                _.filter(document.Filter.tags, (t) => {
                    const tagType = t.value.split('-')[0];
                    const tagId = t.value.split('-')[1];
                    if (tagType === 'workstream') {
                        requestUrl += `&workstream=${tagId}`
                    }
                })
            }
            getData(`${requestUrl}&status=new`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    showToast('success', 'Documents successfully retrieved.')
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
            getData(`${requestUrl}&status=library`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    showToast('success', 'Documents successfully retrieved.')
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        }, 1000);
    }

    render() {
        const { document, global } = this.props;
        const { Filter } = { ...document }
        const typeList = [
            { id: '', name: 'All Document Types' },
            { id: 'folder', name: 'Folder' },
            { id: 'document', name: 'document' },
        ];
        const statusList = [
            { id: "", name: "All Status" },
            { id: 1, name: 'Completed' },
            { id: 0, name: 'Uncompleted' },
        ];

        let tagOptions = [];
        if (typeof global.SelectList['workstreamList'] !== 'undefined') {
            global.SelectList.workstreamList.map((e) => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) });
        }
        if (typeof global.SelectList['taskList'] !== 'undefined') {
            global.SelectList.taskList.filter((e) => { return e.status != "Completed" }).map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) });
        }

        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-3 mb5">
                        <label>Document Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={(typeof document.Filter.isCompleted !== 'undefined') ? document.Filter.isCompleted : ''}
                            onChange={(e) => this.setDropDown("isCompleted", e.value)} />
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Document Tags</label>
                        <DropDown multiple={true}
                            required={false}
                            options={tagOptions}
                            selected={(typeof document.Filter.tags !== 'undefined' && document.Filter.tags.length > 0) ? document.Filter.tags : []}
                            onChange={(e) => this.setDropDown("tags", e)}
                        />
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Search</label>
                        <input class="form-control" type="text" placeholder="Search" name='search' aria-label="Search" value={(typeof document.Filter.search !== 'undefined') ? document.Filter.search : ''} onChange={(e) => this.handleOnChange(e)} />
                    </div>
                    <div class="col-md-3 mb5">
                        <label></label>
                        <div class="form-group">
                            <button type="button" class="btn btn-primary pull-right" data-toggle="modal" data-target="#uploadFileModal" >
                                Upload Files &nbsp; <i class="fa fa-caret-down"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}