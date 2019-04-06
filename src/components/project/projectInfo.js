import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { showToast, getData } from '../../globalFunction';
import { Loading } from "../../globalComponents";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        members: store.members
    }
})
export default class ProjectInfo extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "renderStatus",
            "fetchProjectDetails",
            "fetchWorkstreams",
            "getNextWorkstreams",
            "renderArrayTd",
            "handleEdit",
            "getMembers"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
    }

    componentDidMount() {
        const { workstream } = { ...this.props };
        this.fetchProjectDetails();
        this.getMembers();
        this.getProjectFormSelectList();

        if (_.isEmpty(workstream.Count)) {
            this.fetchWorkstreams(1);
        }
    }

    getMembers() {
        const { match, dispatch } = { ...this.props };
        const projectId = match.params.projectId;
        getData(`/api/project/getProjectMembers?linkId=${projectId}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_MEMBERS_LIST", list: c.data });
        });
    }

    getProjectFormSelectList() {
        const { dispatch } = { ...this.props };
        getData(`/api/type`, {}, (c) => {
            dispatch({ type: "SET_TYPE_LIST", list: c.data });
        });
        getData(`/api/globalORM/selectList?selectName=usersList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'usersList' })
        });
    }

    fetchProjectDetails() {
        const { match, dispatch } = { ...this.props };
        const projectId = match.params.projectId;

        getData(`/api/project/detail/${projectId}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: c.data });
                dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            } else {
                showToast("error", "Error retrieving project. Please try again later.");
            }
        });
    }
    fetchWorkstreams(page) {
        const { match, dispatch, loggedUser } = { ...this.props };
        const projectId = match.params.projectId;
        const requestUrl = `/api/workstream?projectId=${projectId}&page=${page}&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
                showToast("success", "Workstream successfully retrieved.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }
    getNextWorkstreams() {
        const { dispatch, workstream } = { ...this.props };
        const { Count } = workstream;

        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
        this.fetchWorkstreams(Count.current_page + 1);
    }

    renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type }) {
        const status = (lateWorkstream > 0) ? `${lateWorkstream} stream(s) delayed` : (workstreamTaskDueToday > 0) ? `${workstreamTaskDueToday} stream(s) due today` : `On track`;
        const color = (lateWorkstream > 0) ? "text-red" : (workstreamTaskDueToday > 0) ? "text-yellow" : "text-green";
        const component = (render_type == "text") ? <p class={`mb0 ${color}`}>
            {status}
        </p> : <span class={`fa fa-circle mb0 mr10 ${color}`}></span>
        return (component);
    }
    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }
    handleEdit() {
        const { dispatch } = { ...this.props };

        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
    }
    render() {
        const { project, workstream, members } = { ...this.props };
        const { Selected } = project;
        const { project: projectName = "", workstream: workstreamList = [], type, color, projectManager = [] } = Selected;
        const workstreamCurrentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const workstreamLastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;
        let lateWorkstream = 0;
        let workstreamTaskDueToday = 0;
        _.map(workstreamList, (e) => {
            if (e.taskOverDue.length) {
                lateWorkstream++;
            }
            if (e.taskDueToday.length) {
                workstreamTaskDueToday++;
            }
        });
        return (
            <div class="row content-row">
                <div class="col-lg-12">
                    <div class="card">
                        <div class={(project.Loading == "RETRIEVING") ? "linear-background" : ""}>
                            {
                                (projectName == "" && project.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                            }
                            {
                                (projectName != "" && project.Loading != "RETRIEVING") && <div id="project-info">
                                    <div class="bb">
                                        <h3 class="mt0 mb20 title">
                                            {this.renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type: "icon" })}
                                            {projectName}
                                        </h3>
                                    </div>
                                    <div>
                                        <div class="row mt10">
                                            <div class="col-lg-8 md-12 col-sm-12">
                                                <div class="row content-row">
                                                    <div class="col-md-12 vh-center space-between">
                                                        <h4 class="m0">
                                                            Project Details
                                                        </h4>
                                                        <a class="logo-action text-grey" onClick={() => this.handleEdit()}>
                                                            <i title="EDIT" class="fa fa-pencil" aria-hidden="true"></i>
                                                        </a>
                                                    </div>
                                                </div>
                                                <div class="row mt10">
                                                    <div class="col-md-6">
                                                        <div>
                                                            <label>Project Name:</label>
                                                            <p>{projectName}</p>
                                                        </div>
                                                        <div>
                                                            <label>Project Lead:</label>
                                                            {
                                                                (projectManager.length > 0) ?
                                                                    <div class="profile-div">
                                                                        <div class="thumbnail-profile">
                                                                            <img src={projectManager[0].user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                        </div>
                                                                        <p class="m0">{projectManager[0].user.firstName + " " + projectManager[0].user.lastName}</p>
                                                                    </div>
                                                                    : "N/A"
                                                            }
                                                        </div>
                                                        <div class="mt10">
                                                            <label>Project Members:</label>
                                                            <div class="display-flex">
                                                                {
                                                                    (members.List.length > 0) ?
                                                                        _.map(_.take(members.List, 2), ({ firstName, lastName, avatar }, index) => {
                                                                            return (
                                                                                <div class="thumbnail-profile" key={index}>
                                                                                    <span title={firstName + " " + lastName}>
                                                                                        <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                                                                    </span>
                                                                                </div>
                                                                            )
                                                                        })
                                                                        : "N/A"
                                                                }
                                                                {
                                                                    ((members.List).length > 2) && <span
                                                                        class="thumbnail-count"
                                                                        title={
                                                                            _(members.List)
                                                                                .filter((o, index) => { return index > 1 })
                                                                                .map(({ firstName, lastName, avatar }) => {
                                                                                    return firstName + " " + lastName
                                                                                })
                                                                                .value()
                                                                                .join("\r\n")
                                                                        }
                                                                    >
                                                                        +{(members.List).length - 2}
                                                                    </span>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6">
                                                        <div>
                                                            <label>Project Type:</label>
                                                            <p>{type.type}</p>
                                                        </div>
                                                        <div>
                                                            <label>Color Indicator:</label>
                                                            <p>
                                                                <span class="fa fa-circle mr10" style={{ color }}></span>
                                                                {color}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-lg-12 md-12 col-sm-12">
                                                <table class="mt20">
                                                    <thead>
                                                        <tr>
                                                            <th scope="col" class="td-left">Workstreams</th>
                                                            <th scope="col">Color</th>
                                                            <th scope="col">Lead</th>
                                                            <th scope="col">Members</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {

                                                            _.map(workstream.List, (data, index) => {
                                                                const { workstream, color, members } = data;
                                                                const workstreamLead = _.find(members, (member) => { return member.memberType == "responsible" })
                                                                const workstreamMembers = _(members)
                                                                    .filter((member) => { return member.memberType != "responsible" })
                                                                    .map((member) => { return member.user })
                                                                    .value();

                                                                return (
                                                                    <tr
                                                                        key={index}
                                                                    >
                                                                        <td data-label="Workstream" class="td-left">
                                                                            <p class="m0">
                                                                                {workstream}
                                                                            </p>
                                                                        </td>
                                                                        <td data-label="Color">
                                                                            <p class="m0">
                                                                                <span class="fa fa-square mr10" style={{ color }}></span>
                                                                                {color}
                                                                            </p>
                                                                        </td>
                                                                        <td data-label="Lead">
                                                                            <p class="m0">
                                                                                {
                                                                                    (typeof workstreamLead != "undefined") ? workstreamLead.user.firstName + " " + workstreamLead.user.lastName : 'N/A'
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td data-label="Members">
                                                                            <div class="display-flex">
                                                                                {
                                                                                    _.map(_.take(workstreamMembers, 2), (member, index) => {
                                                                                        const { firstName, lastName, avatar } = member
                                                                                        return (
                                                                                            <div class="thumbnail-profile" key={index}>
                                                                                                <span title={firstName + " " + lastName}>
                                                                                                    <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                                                                                </span>
                                                                                            </div>
                                                                                        )
                                                                                    })
                                                                                }
                                                                                {
                                                                                    (workstreamMembers.length > 2) && <span
                                                                                        class="thumbnail-count"
                                                                                        title={
                                                                                            _(workstreamMembers)
                                                                                                .filter((o, index) => { return index > 1 })
                                                                                                .map((member) => {
                                                                                                    const { firstName, lastName } = member;
                                                                                                    return firstName + " " + lastName
                                                                                                })
                                                                                                .value()
                                                                                                .join("\r\n")
                                                                                        }
                                                                                    >
                                                                                        +{members.length - 2}
                                                                                    </span>
                                                                                }
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })
                                                        }
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                            {
                                (workstream.List.length == 0 && workstream.Loading != "RETRIEVING" && project.Loading != "RETRIEVING") && <p class="mb0 mt10 text-center"><strong>No Records Found</strong></p>
                            }
                            {
                                (workstream.Loading == "RETRIEVING" && (workstream.List).length > 0 && project.Loading != "RETRIEVING") && <Loading />
                            }
                            {
                                (_.isEmpty(workstream) == false && (workstreamCurrentPage != workstreamLastPage) && workstream.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextWorkstreams()}>Load More Workstream</a></p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}