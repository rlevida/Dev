import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";
import { Searchbar, DropDown, Loading } from "../../globalComponents";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

let delayTimer = "";
let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        workstream: store.workstream,
        task: store.task
    }
})

class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);
        _.map(["fetchWorkstreamList", "handleDropdown", "getWorkstreamList", "getTaskList"], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        const { workstream, task } = { ...this.props };
        if (_.isEmpty(workstream.Count)) {
            this.getWorkstreamList()
        }
        if (_.isEmpty(task.Count)) {
            this.getTaskList()
        }
    }

    handleDropdown(name, value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: value } });
    }

    handleFilter() {
        const { dispatch, loggedUser, match, document } = { ...this.props };
        const projectId = match.params.projectId;
        const { uploadFrom, uploadTo, uploadedBy, tagWorkstream, tagTask, fileName } = { ...document.Filter };
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

        if (ActiveTab === "active") {
            requestUrl += `&folderId=null&type=document`;
        }

        if (ActiveTab === 'library') {
            requestUrl += `&folderId=null&type=folder`;
        }

        if (uploadFrom && uploadTo) {
            requestUrl += `&uploadFrom=${uploadFrom}&uploadTo=${uploadTo}`;
        }

        if (uploadedBy) {
            requestUrl += `&uploadedBy=${uploadedBy}`;
        }
        if (tagWorkstream) {
            requestUrl += `&workstream=${tagWorkstream}`;
        }
        if (tagTask) {
            requestUrl += `&task=${tagTask}`;
        }
        if (fileName) {
            requestUrl += `&fileName=${fileName}`;
        }
        getData(`${requestUrl}`, {}, (c) => {
            const { result, count } = { ...c.data }
            dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count })
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' })

        });
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

    setTaskList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.getTaskList(options);
        }, 1500);
    }

    getTaskList(options) {
        const { dispatch, match } = this.props;
        const projectId = match.params.projectId;
        let fetchUrl = `/api/task?projectId=${projectId}&page=1`;
        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&task=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const taskOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.task } })
                .value();
            dispatch({ type: "SET_TASK_SELECT_LIST", List: taskOptions });
        });
    }

    render() {
        const { document, workstream, task } = this.props;
        const { uploadFrom, uploadTo, uploadedBy, tagWorkstream, fileName, tagTask } = { ...document.Filter };
        return (
            <div>
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                <div class="flex-row tab-row mb0">
                                    <div class="flex-col">
                                        <a class="btn btn-default" onClick={(e) => e.preventDefault()}>Filter</a>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 col-sm-6 col-xs-12 pd0 ">
                                <div class="button-action">
                                    <input class="form-control mr10" type="text" value={fileName} onChange={(e) => this.handleDropdown('fileName', e.target.value)} placeholder="Search File Name"></input>
                                    <a class="btn btn-default" onClick={() => this.handleFilter()}><i className="fa fa-search"></i></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}>
                    {(document.Loading === "") &&
                        <div class="card-body m0">
                            <div class="row">
                                <div class="col-lg-6 col-md-6 col-sm-6">
                                    <label> Upload date:</label>
                                    <div class="form-group input-inline">
                                        <div>
                                            <label>
                                                From
                                            </label>
                                        </div>
                                        <div>
                                            <DatePicker
                                                name="uploadFrom"
                                                dateFormat="MMMM DD, YYYY"
                                                onChange={date => {
                                                    this.handleDropdown('uploadFrom', date);
                                                }}
                                                value={(moment(uploadFrom, 'MMMM DD, YYYY', true).isValid()) ? moment(uploadFrom).format('MMMM DD, YYYY') : ""}
                                                placeholderText="Select valid upload date"
                                                class="form-control"
                                                selected={uploadFrom}
                                            />
                                        </div>
                                        <div class="ml10">
                                            <label>
                                                To
                                            </label>
                                        </div>
                                        <div>
                                            <DatePicker
                                                name="uploadTo"
                                                dateFormat="MMMM DD, YYYY"
                                                onChange={date => {
                                                    this.handleDropdown('uploadTo', date);
                                                }}
                                                value={(moment(uploadTo, 'MMMM DD, YYYY', true).isValid()) ? moment(uploadTo).format('MMMM DD, YYYY') : ""}
                                                placeholderText="Select valid upload date"
                                                class="form-control"
                                                selected={uploadTo}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div class="col-lg-6 col-md-6 col-sm-6">
                                    <label>User:</label>
                                    <input class="form-control" type="text" name="uploadedBy" onChange={(e) => this.handleDropdown('uploadedBy', e.target.value)} value={uploadedBy || ""}></input>
                                </div>

                            </div>
                            <div class="row">
                                <div class="col-lg-6  col-md-6 col-sm-6">
                                    <label>Workstream:</label>
                                    <DropDown
                                        id="workstream-options"
                                        options={workstream.SelectList}
                                        onInputChange={this.getWorkstreamList}
                                        selected={tagWorkstream}
                                        loading={true}
                                        isClearable={true}
                                        onChange={(e) => {
                                            this.handleDropdown("tagWorkstream", (e == null) ? null : e.value);
                                        }}
                                        required={true}
                                        disabled={Loading === "SUBMITTING" ? true : false}
                                    />
                                </div>
                                <div class="col-lg-6  col-md-6 col-sm-6">
                                    <label>Task:</label>
                                    <DropDown
                                        id="workstream-options"
                                        options={task.SelectList}
                                        onInputChange={this.getTaskList}
                                        selected={tagTask}
                                        loading={true}
                                        isClearable={true}
                                        onChange={(e) => {
                                            this.handleDropdown("tagTask", (e == null) ? null : e.value);
                                        }}
                                        required={true}
                                        disabled={Loading === "SUBMITTING" ? true : false}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentFilter);