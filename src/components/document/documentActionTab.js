import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";
import { Searchbar, DropDown, Loading } from "../../globalComponents";

let delayTimer = "";
let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        workstream: store.workstream
    }
})

class DocumentActionTab extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "setDropDown",
            "handleDate",
            "handleChange",
            "fetchWorkstreamList",
            "getWorkstreamList"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        this.getWorkstreamList();
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder, match, document } = { ...this.props };
        const projectId = match.params.projectId;

        if (_.isEqual(prevProps.document.Filter, document.Filter) == false) {
            clearTimeout(delayTimer);

            if (_.isEmpty(folder.Selected) === false) {
                dispatch({ type: "SET_SELECTED_FOLDER", Selected: {} })
                dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] })
            }
            const { status, tagWorkstream } = { ...document.Filter };
            let requestUrl = `/api/document?linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });

            delayTimer = setTimeout(() => {

                if (status === "trash") {
                    requestUrl += `&isActive=0&isDeleted=0`
                } else {
                    requestUrl += `&isActive=1`

                    if (status === 'active' || status === 'sort') {
                        requestUrl += `&folderId=null&type=document`;
                    }

                    if (status === 'library') {
                        requestUrl += `&folderId=null&type=folder`;
                        this.fetchFolderList();
                    }

                    if (status === "archived") {
                        requestUrl += `&isArchived=1`;
                    } else {
                        requestUrl += `&isArchived=0`;
                    }

                    if (tagWorkstream) {
                        requestUrl += `&workstream=${tagWorkstream}`;
                    }
                }

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

    fetchFolderList() {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let requestUrl = `/api/document?page=1&isDeleted=0&linkId=${projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder`;

        if (typeof options != "undefined" && options != "") {
            requestUrl += `&name=${options}`;
        }

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                const folderOptions = _(c.data.result)
                    .map((e) => {
                        const fName = e.documentNameCount > 0 ? `${e.name}(${e.documentNameCount})` : e.name;
                        return { id: e.id, name: fName }

                    })
                    .value();
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            } else {
                showToast('success', 'Something went wrong!');
            }
        });
    }

    handleChange(params) {
        const { dispatch, document } = this.props;
        if (document.Filter.workstream != params.workstream) {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [] });
            dispatch({ type: "SET_DOCUMENT_FILTER", filter: params });
        }
    }

    handleDate(e) {
        const { dispatch } = this.props;
        const selectedDate = (e.target.value != '') ? moment(e.target.value).format('YYYY-MM-DD') : '';
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [e.target.name]: selectedDate } });
    }

    getWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchWorkstreamList(options) {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let fetchUrl = `/api/workstream?projectId=${projectId}&page=1&userId=${loggedUser.data.id}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&workstream=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const workstreamOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.workstream } })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    setDropDown(name, e) {
        const { dispatch, folder, document: { Filter } } = this.props;
        let filterObj = { ...Filter };
        filterObj = { ...filterObj, [name]: e };
        if (!_.isEmpty(folder.SelectedLibraryFolderName) || !_.isEmpty(folder.SelectedNewFolderName)) {
            dispatch({ type: 'CLEAR_FOLDER' })
        }

        if (_.isEqual(filterObj, this.props.document.Filter) == false) {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: {} });
            dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: e } });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
            dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
        }
    }

    render() {
        const { dispatch, document, workstream } = this.props;
        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            <div class="flex-col">
                                <a class={document.Filter.status === 'active' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'active')}>Active Files</a>
                            </div>
                            <div class="flex-col">
                                <a class={document.Filter.status === 'library' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'library')}>Library</a>
                            </div>
                            <div class="flex-col">
                                <a class={document.Filter.status === 'sort' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'sort')}>Sort Files</a>
                            </div>
                            <div class="flex-col">
                                <a class={document.Filter.status === 'trash' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'trash')}>Trash</a>
                            </div>
                            <div class="flex-col">
                                <a class={document.Filter.status === 'archived' ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown('status', 'archived')}>Archived</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        {(document.Filter.status !== "trash" && document.Filter.status !== "archived") &&
                            <div class="button-action">
                                {
                                    (document.Filter.status === 'active' && document.Loading === "") &&
                                    <DropDown
                                        id="workstream-options"
                                        options={workstream.SelectList}
                                        onInputChange={this.getWorkstreamList}
                                        selected={document.Filter.tagWorkstream}
                                        loading={true}
                                        isClearable={true}
                                        onChange={(e) => {
                                            this.setDropDown("tagWorkstream", (e == null) ? null : e.value);
                                        }}
                                        required={true}
                                        disabled={Loading === "SUBMITTING" ? true : false}
                                    />
                                }
                                {
                                    (document.Loading === "") &&
                                    <a class="btn btn-default mr10" onClick={() => dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'Upload' })}>
                                        <span>
                                            <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                            Add New File
                                    </span>
                                    </a>
                                }
                                {
                                    (document.Filter.status !== 'active' && document.Loading === "") &&
                                    <a class="btn btn-default" data-toggle="modal" data-target="#folderModal">
                                        <span>
                                            <i class="fa fa-folder fa-lg mr10"></i>
                                            Add New Folder
                                        </span>
                                    </a>
                                }
                            </div>
                        }
                        {(document.Filter.status === "trash") &&
                            <div class="button-action">
                                <a class="btn btn-default" data-toggle="modal" data-target="#deleteModal">
                                    <span>
                                        <i class="fa fa-trash fa-lg mr10"></i>
                                        Empty
                                    </span>
                                </a>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentActionTab);