import React from "react";
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";

@connect(store => {
    return {
        status: store.status,
        loggedUser: store.loggedUser,
        type: store.type,
        project: store.project
    };
})
export default class ProjectActionTab extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser } = this.props;

        if (_.isEqual(prevProps.project.Filter, this.props.project.Filter) == false) {
            const { isActive = 1, typeId, projectProgress, search, sort } = this.props.project.Filter;
            const dueDateMoment = moment(moment().format('YYYY-MM-DD')).utc().format("YYYY-MM-DD HH:mm");

            let fetchUrl = `/api/v2project?page=1&typeId=${typeId}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&hasMembers=1&isActive=${isActive}&dueDate=${dueDateMoment}`;

            dispatch({ type: "RESET_PROJECT", List: [], Loading: "RETRIEVING" });

            if (projectProgress) {
                fetchUrl += `&projectProgress=${projectProgress}`;
            }

            if (search) {
                fetchUrl += `&project=${search}`;
            }
            if (sort && sort.indexOf("project") > -1) {
                fetchUrl += `&sort=${sort}`;
            }

            getData(fetchUrl, {}, c => {
                const list = c.data.result.map(e => {
                    const completionRate = (e.completion_rate.completed.count / e.numberOfTasks) * 100;
                    return { ...e, completionRate: isNaN(completionRate) ? 0 : completionRate };
                });

                dispatch({ type: "SET_PROJECT_LIST", list: list, page: 1, hasNextPage: list.length >= 25 });
                dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            });
        }
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({
            type: "SET_PROJECT_FILTER",
            filter: {
                [name]: e, ...(name === 'typeId' ? { isActive: 1 } : {})
            }
        });
    }
    handleChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_FILTER", filter: { [e.target.name]: e.target.value } });
    }
    render() {
        const { type, project, dispatch, loggedUser } = this.props;
        const { Filter } = { ...project };
        const projectTypes = [
            ...(loggedUser.data.userType !== "External" ? [{ id: "", name: "All" }] : []),
            ..._(type.List)
                .filter(o => {
                    if (loggedUser.data.userType == "External") {
                        return o.linkType == "project" && o.type === "Client";
                    } else {
                        return o.linkType == "project";
                    }
                })
                .map(o => {
                    return { id: o.id, name: o.type };
                })
                .value()
        ];
        const projectProcessOptions = [{ id: "All", name: "All" }, { id: "On Time", name: "On Time" }, { id: "Issues", name: "Issues" }];
        const projectTypeOptions = [{ id: 1, name: "Client" }, { id: 2, name: "Internal" }, { id: 3, name: "Private" }];
        const sortOptions = [{ id: "completionRate-desc", name: "Highest to Lowest" }, { id: "completionRate-asc", name: "Lowest to Highest" }, { id: "project-asc", name: "A to Z" }, { id: "project-desc", name: "Z to A" }];

        return (
            <div class="container-fluid filter">
                <div class="row mt10">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            {_.map(projectTypes, (projectType, index) => {
                                return (
                                    <div class="flex-col" key={index}>
                                        <a class={projectType.id == project.Filter.typeId && project.Filter.isActive ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("typeId", projectType.id)}>
                                            {projectType.name}
                                        </a>
                                    </div>
                                );
                            })}
                            <div class="flex-col">
                                <a class={!project.Filter.isActive ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("isActive", 0)}>
                                    Inactive
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row content-row">
                    <div class="col-md-12 col-sm-12 col-xs-12 pd0">
                        <div class="button-action">
                            <input type="text" value={Filter.search} name="search" class="form-control mr10" placeholder="Search Project Name" onChange={e => this.handleChange(e)} />
                            <DropDown multiple={false} required={false} options={sortOptions} selected={Filter.sort} onChange={e => this.setDropDown("sort", e.value)} label="Sort by:" />
                            {project.Filter.typeId === "Inactive" && loggedUser.data.userType !== "External" && (
                                <DropDown multiple={false} required={false} options={projectTypeOptions} selected={Filter.projectType} onChange={e => this.setDropDown("projectType", e.value)} label="Select Project Type" />
                            )}
                            {project.Filter.typeId !== "Inactive" && (
                                <DropDown multiple={false} required={false} options={projectProcessOptions} selected={Filter.projectProgress} onChange={e => this.setDropDown("projectProgress", e.value)} label="Select Status" />
                            )}
                            {loggedUser.data.userRole <= 4 && project.Filter.typeId !== "Inactive" && (
                                <a
                                    class="btn btn-default"
                                    onClick={e => {
                                        dispatch({ type: "SET_PROJECT_SELECTED", Selected: { isActive: 1 } });
                                        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
                                    }}
                                >
                                    <span>
                                        <i class="fa fa-plus mr10" aria-hidden="true" />
                                        Add New Project
                                    </span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
