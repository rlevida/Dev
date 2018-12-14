import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { DropDown } from "../../../globalComponents";
import { getData, showToast, displayDate, setDatePicker } from "../../../globalFunction";

let delayTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder
    }
})

export default class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder } = this.props;
        if (_.isEqual(prevProps.document.Filter, this.props.document.Filter) == false) {
            clearTimeout(delayTimer);
            const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo } = this.props.document.Filter;
            let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`;

            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'LibraryDocumentLoading' });

            delayTimer = setTimeout(() => {
                if (typeof isCompleted !== 'undefined' && isCompleted !== '') {
                    requestUrl += `&isCompleted=${isCompleted}`
                }
                if (typeof search !== 'undefined' && search !== '') {
                    requestUrl += `&search=${search}`
                }
                if (typeof tags !== 'undefined') {
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

                getData(`${requestUrl}&status=new&folderId=${folder.SelectedNewFolder.id}`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                        dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                        dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                        showToast('success', 'Documents successfully retrieved.')
                    } else {
                        showToast('success', 'Something went wrong!')
                    }
                });

                getData(`${requestUrl}&status=library&folderId=${folder.SelectedLibraryFolder.id}`, {}, (c) => {
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
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: e }, name: name });
    }

    handleOnChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILTER', filter: { [e.target.name]: e.target.value } });
    }

    render() {
        const { document, global } = this.props;
        const { Filter } = { ...document }
        const statusList = [
            { id: "", name: "All Status" },
            { id: 1, name: 'Completed' },
            { id: 0, name: 'Uncompleted' },
        ];
        const memberList = _.filter(global.SelectList.projectMemberList, (e) => { return e.userType !== 'Internal' })
            .map((e) => { return { id: e.id, name: `${e.firstName} ${e.lastName}` } })

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
                <div class="row">
                    <div class="col-md-3 col-sm-12 col-xs-6 mb5">
                        <div class="input-group date" style={{ width: "100%" }}>
                            <label>Upload date (From)</label>
                            <input type="text"
                                class="form-control datepicker"
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 4
                                }}
                                id="uploadFrom"
                                name="uploadFrom"
                                value={((typeof Filter.uploadFrom != "undefined" && Filter.uploadFrom != null) && Filter.uploadFrom != '') ? displayDate(Filter.uploadFrom) : ""}
                            />
                        </div>
                    </div>
                    <div class="col-md-3 col-sm-12 col-xs-6 mb5">
                        <div class="input-group date" style={{ width: "100%" }}>
                            <label>Upload date (To)</label>
                            <input type="text"
                                class="form-control datepicker"
                                style={{
                                    backgroundColor: "white",
                                    borderRadius: 4
                                }}
                                id="uploadTo"
                                name="uploadTo"
                                value={((typeof Filter.uploadTo != "undefined" && Filter.uploadTo != null) && Filter.uploadTo != '') ? displayDate(Filter.uploadTo) : ""}
                            />
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3 mb5">
                        <label>Upload By</label>
                        <input class="form-control" type="text" placeholder="Uploaded by" name='uploadedBy' aria-label="Search" value={(typeof document.Filter.uploadedBy !== 'undefined') ? document.Filter.uploadedBy : ''} onChange={(e) => this.handleOnChange(e)} />
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Members</label>
                        <DropDown multiple={true}
                            required={false}
                            options={memberList}
                            selected={(typeof document.Filter.members !== 'undefined') ? document.Filter.members : []}
                            onChange={(e) => this.setDropDown("members", e)}
                        />
                    </div>
                </div>
            </div>
        )
    }
}