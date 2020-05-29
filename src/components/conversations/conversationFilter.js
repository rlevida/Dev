import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData } from "../../globalFunction";
import { DropDown, Loading } from "../../globalComponents";

import "react-datepicker/dist/react-datepicker.css";

let delayTimer = "";
let keyTimer = "";

@connect(store => {
    return {
        notes: store.notes,
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        workstream: store.workstream,
        task: store.task,
        teams: store.teams,
        settings: store.settings
    };
})
class ConversationFilter extends React.Component {
    constructor(props) {
        super(props);
        _.map(["handleDropdown", "getWorkstreamList", "fetchWorkstreamList", 'setDropDownMultiple'], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleDropdown(name, value) {
        const { dispatch } = { ...this.props };

        dispatch({ type: "SET_NOTES_FILTER", filter: { [name]: value } });
    }

    setDropDownMultiple(name, values) {
        const { dispatch, notes } = this.props;
        const selected = { ...notes.Selected, [name]: values };
        console.log(name, values)
        // dispatch({ type: "SET_NOTES_SELECTED", Selected: selected });
    }

    handleFilter() {
        const { dispatch, loggedUser, match, document, folder } = { ...this.props };
        const projectId = match.params.projectId;
        const { uploadFrom, uploadTo, uploadedBy, tagWorkstream, tagTask, fileName } = { ...document.Filter };
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isArchived=0&isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

        if (ActiveTab === "active") {
            requestUrl += `&folderId=null&type=document`;
        }
        if (ActiveTab === "library") {
            if (folder.Selected.id) {
                requestUrl += `&folderId=${folder.Selected.id}`;
            } else if (!uploadFrom && !uploadTo && !uploadedBy && !tagWorkstream && !tagTask && !fileName) {
                requestUrl += `&type=folder&folderId=null`;
            }
        }

        if (uploadFrom && uploadTo) {
            requestUrl += `&uploadFrom=${moment(uploadFrom).format("YYYY-MM-DD")}&uploadTo=${moment(uploadTo).format("YYYY-MM-DD")}`;
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
        getData(`${requestUrl}`, {}, c => {
            const { result, count } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
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
        getData(fetchUrl, {}, c => {
            const workstreamOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.workstream };
                })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    render() {
        const { notes, workstream, teams, loggedUser, settings } = this.props;
        const { workstreamId, people, privacyType, status } = { ...notes.Filter };
        const userList = teams.MemberList;

        return (
            <div>
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                <div class="flex-row tab-row mb0">
                                    <div class="flex-col">
                                        <a class="btn btn-default" onClick={e => e.preventDefault()}>
                                            Filter
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-body m0">
                    <div class="row">
                        <div class="col-lg-4  col-md-4 col-sm-4 mt10">
                            <label>Public/Private:</label>
                            <DropDown
                                id="public-private-options"
                                options={[{ id: 'public', name: 'Public' }, { id: 'private', name: 'Private' }]}
                                selected={privacyType}
                                loading={true}
                                isClearable={true}
                                onChange={e => {
                                    this.handleDropdown("privacyType", e == null ? null : e.value);
                                }}
                                required={true}
                                disabled={Loading === "SUBMITTING" ? true : false}
                            />
                        </div>
                        <div class="col-lg-4 col-md-4 col-sm-4 mt10">
                            <label>Open/Closed:</label>
                            <DropDown
                                id="open-closed-options"
                                options={[{ id: 'open', name: 'Open' }, { id: 'closed', name: 'Closed' }]}
                                selected={status}
                                loading={true}
                                isClearable={true}
                                onChange={e => {
                                    this.handleDropdown("status", e == null ? null : e.value);
                                }}
                                required={true}
                                disabled={Loading === "SUBMITTING" ? true : false}
                            />
                        </div>
                        <div class="col-lg-4 col-md-4 col-sm-4 mt10">
                            <label>People:</label>
                            <DropDown
                                multiple={true}
                                required={true}
                                options={_(userList)
                                    .uniqBy("id")
                                    .filter(o => {
                                        return o.id != loggedUser.data.id;
                                    })
                                    .value()}
                                onInputChange={this.getUsers}
                                selected={people === '' ? [] : people}
                                placeholder={"Search users"}
                                onChange={e => {
                                    this.setDropDownMultiple("users", e == null ? [] : e);
                                }}
                                customLabel={o => {
                                    return (
                                        <div class="drop-profile">
                                            {o.image != "" && <img
                                                src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                alt="Profile Picture" class="img-responsive" />}
                                            <p class="m0">{o.label}</p>
                                        </div>
                                    );
                                }}
                                customSelected={({ value: o }) => {
                                    return (
                                        <div class="drop-profile">
                                            {o.image != "" && <img
                                                src={`${settings.site_url}api/file/profile_pictures/${o.image}`}
                                                alt="Profile Picture" class="img-responsive" />}
                                            <p class="m0">{o.label}</p>
                                            <span
                                                class="Select-value-icon close-custom"
                                                aria-hidden="true"
                                                onClick={() => {
                                                    const updatedList = _.remove(notes.Selected.users, ({ value }) => {
                                                        return value != o.value;
                                                    });
                                                    this.setDropDownMultiple("users", updatedList);
                                                }}
                                            >
                                                ×
                                                </span>
                                        </div>
                                    );
                                }}
                                isClearable={teams.MemberList.length > 0}
                            />
                        </div>
                        <div class="col-lg-4 col-md-4 col-sm-4 mt10">
                            <label>Workstream:</label>
                            <DropDown
                                id="workstream-options"
                                options={workstream.SelectList}
                                onInputChange={this.getWorkstreamList}
                                selected={workstreamId}
                                loading={true}
                                isClearable={true}
                                onChange={e => {
                                    this.handleDropdown("workstreamId", e == null ? null : e.value);
                                }}
                                required={true}
                                disabled={Loading === "SUBMITTING" ? true : false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(ConversationFilter);
