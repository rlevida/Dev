import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { withRouter } from "react-router";
import { getData } from "../../globalFunction";
import { DropDown, Loading } from "../../globalComponents";

import "react-datepicker/dist/react-datepicker.css";

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
        _.map(["handleDropdown", "getWorkstreamList", "fetchWorkstreamList", 'setDropDownMultiple', 'getUsers', 'fetchUsers'], fn => {
            this[fn] = this[fn].bind(this);
        });
        this.state = {
            workstreamOptions: [],
            peopleOptions: []
        };
    }

    componentDidMount() {
        this.fetchWorkstreamList();
        this.fetchUsers();
    }

    handleDropdown(name, value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_NOTES_SELECTED", Selected: {} })
        dispatch({ type: "SET_NOTES_FILTER", filter: { [name]: value } });
    }

    setDropDownMultiple(name, values) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_NOTES_FILTER", filter: { [name]: values } });
    }


    getWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchWorkstreamList(options) {
        const { loggedUser, match } = { ...this.props };
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

            this.setState({ ...this.state, workstreamOptions: workstreamOptions })
        });
    }

    getUsers(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchUsers(options);
        }, 1500);
    }

    fetchUsers(options) {
        const { match } = { ...this.props };
        const projectId = match.params.projectId;

        let fetchUrl = `/api/project/getProjectMembers?page=1&linkId=${projectId}&linkType=project`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, c => {
            const peopleOptions = _(c.data)
                .map(e => {
                    return { id: e.id, name: e.firstName + " " + e.lastName, image: e.avatar };
                })
                .value();
            this.setState({ ...this.state, peopleOptions: peopleOptions })
        });
    }

    render() {
        const { workstreamOptions, peopleOptions } = { ...this.state };
        const { notes, teams, loggedUser, settings } = { ...this.props };
        const { workstreamId, privacyType, status, taggedUsers } = { ...notes.Filter };

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
                                options={[{ id: 'Public', name: 'Public' }, { id: 'Private', name: 'Private' }]}
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
                            <label>Status:</label>
                            <DropDown
                                id="open-closed-options"
                                options={[{ id: 'OPEN', name: 'Open' }, { id: 'CLOSED', name: 'Closed' }]}
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
                                options={_(peopleOptions)
                                    .uniqBy("id")
                                    .filter(o => {
                                        return o.id != loggedUser.data.id;
                                    })
                                    .value()}
                                onInputChange={this.getUsers}
                                selected={taggedUsers === '' ? [] : taggedUsers}
                                placeholder={"Search users"}
                                onChange={e => {
                                    this.setDropDownMultiple("taggedUsers", e == null ? [] : e);
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
                                                    const updatedList = _.remove(taggedUsers, ({ value }) => {
                                                        return value != o.value;
                                                    });

                                                    this.setDropDownMultiple("taggedUsers", updatedList);
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
                                options={workstreamOptions}
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
