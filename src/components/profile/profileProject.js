import React from "react";
import _ from "lodash";
import { Link } from 'react-router-dom';

import { connect } from "react-redux";
import { getData } from "../../globalFunction";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        project: store.project
    }
})
export default class ProfileProject extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "getList",
            "getNext"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_LIST", list: [], count: {} });
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
    }

    componentDidMount() {
        this.getList(1);
    }

    getList(page) {
        const { dispatch, loggedUser, project } = { ...this.props };
        const { List } = project;

        let fetchUrl = `/api/project?page=${page}&userId=${loggedUser.data.id}`;

        if (loggedUser.data.userRole >= 3) {
            fetchUrl += `&userRole=${loggedUser.data.userRole}`
        }

        getData(fetchUrl, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: List.concat(c.data.result), count: c.data.count })
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
        });
    }

    getNext() {
        const { dispatch, project } = { ...this.props };
        const { Count } = project;

        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
        this.getList(Count.current_page + 1);
    }

    render() {
        const { project } = { ...this.props };
        const { Loading, List, Count } = project;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        const projectList = _(List).map((o) => {
            return { ...o, type: o.type.type };
        })
            .groupBy("type")
            .map((value, key) =>
                ({
                    type: key,
                    projects: value
                }))
            .value();

        return (
            <div>
                <h4><strong>Project Involvement</strong></h4>
                <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                    {
                        _.map(projectList, (o, index) => {
                            return (
                                <div key={index} class="profile-project">
                                    <p class="mb5">
                                        <strong>
                                            <span title={o.type}>
                                                <i class={`mr5 ${(o.type == "Client") ? "fa fa-users" : (o.type == "Private") ? "fa fa-lock" : "fa fa-cloud"}`}></i>
                                            </span>
                                            {o.type} Projects
                                        </strong>
                                    </p>
                                    <div class="ml15">
                                        {
                                            _.map(o.projects, (o, index) => {
                                                return (
                                                    <p class="m0" key={index}><Link to={`/projects/${o.id}`}>{o.project}</Link></p>
                                                )
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                    {
                        (currentPage != lastPage && Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Projects</a></p>
                    }
                    {
                        ((List).length == 0 && Loading != "RETRIEVING") && <p class="mb0"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        )
    }
}