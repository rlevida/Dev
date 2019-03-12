import React from "react";
import moment from 'moment';
import _ from 'lodash';
import { connect } from "react-redux"

import { Loading } from "../../globalComponents";
import { showToast, getData } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        type: store.type
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        _.map([
            "getNextResult",
            "setFilter"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        let { dispatch, type } = this.props;
        getData(`/api/type`, {}, (c) => {
            dispatch({ type: "SET_TYPE_LIST", list: c.data })
        });

        getData(`/api/project?page=${1}`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count });
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            showToast("success", "Project successfully retrieved.");
        });
    }

    componentDidUpdate(prevProps) {
        const { dispatch, project } = { ...this.props };

        if (_.isEqual(prevProps.project.Filter, project.Filter) == false) {
            const { typeId, projectStatus } = project.Filter;
            const dueDateMoment = moment().format("YYYY-MM-DD");

            dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_PROJECT_LIST", list: [] });

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/project?page=1&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`, {}, (c) => {
                    dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count });
                    dispatch({ type: "SET_PROJECT_LOADING", Loading: false });
                    showToast("success", "Project successfully retrieved.");
                });
            }, 1000);
        }
    }

    getNextResult() {
        const { project, dispatch } = { ...this.props };
        const { Count, List, Filter } = project;
        const { typeId, projectStatus } = Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");

        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });

        getData(`/api/project?page=${Count.current_page + 1}&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: List.concat(c.data.result), count: c.data.count })
            showToast("success", "Project successfully retrieved.");
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
        });
    }

    setFilter(name, e) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_FILTER", filter: { [name]: e } });
    }

    render() {
        const { project, type } = { ...this.props };
        const currentPage = (typeof project.Count.current_page != "undefined") ? project.Count.current_page : 1;
        const lastPage = (typeof project.Count.last_page != "undefined") ? project.Count.last_page : 1;
        const projectTypes = [...[{ id: "", name: "All" }], ..._(type.List).filter((o) => { return o.linkType == "project" }).map((o) => { return { id: o.id, name: o.type } }).value()];

        return (
            <div>
                <div class="flex-row tab-row">
                    {
                        _.map(projectTypes, (projectType, index) => {
                            return (<div class="flex-col" key={index}>
                                <a class={(projectType.id == project.Filter.typeId) ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setFilter("typeId", projectType.id)}>{projectType.name}</a>
                            </div>)
                        })
                    }
                </div>
                <div class={(project.Loading == "RETRIEVING" && (project.List).length == 0) ? "linear-background" : ""}>
                    {
                        ((project.List).length > 0) && <table>
                            <thead>
                                <tr>
                                    <th scope="col">Project Name</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">New Docs</th>
                                    <th scope="col">Last Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.map(project.List, (projectElem, index) => {
                                        const { project, type, newDocuments, dateAdded } = { ...projectElem };
                                        return (
                                            <tr key={index}>
                                                <td data-label="Project Name">
                                                    <p class="mb0"><strong>{project}</strong></p>
                                                </td>
                                                <td data-label="Type">
                                                    <p class="mb0">
                                                        <span title={type.type}>
                                                            <i class={(type.type == "Client") ? "fa fa-users" : (type.type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></i>
                                                        </span>
                                                    </p>
                                                </td>
                                                <td data-label="New Docs">
                                                    <p class="mb0">
                                                        {newDocuments}
                                                    </p>
                                                </td>
                                                <td data-label="Last Update">
                                                    <p class="mb0">
                                                        {moment(dateAdded).from(new Date())}
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    }
                    {
                        (project.Loading == "RETRIEVING" && (project.List).length > 0) && <Loading />
                    }
                    {
                        (currentPage != lastPage && project.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Projects</a></p>
                    }
                    {
                        ((project.List).length == 0 && project.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        )
    }
}