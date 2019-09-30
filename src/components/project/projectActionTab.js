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
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser } = this.props;

        if (_.isEqual(prevProps.project.Filter, this.props.project.Filter) == false) {
            const { typeId, projectType, projectProgress } = this.props.project.Filter;
            const dueDateMoment = moment().format("YYYY-MM-DD");
            let fetchUrl = `/api/project?page=1&typeId=${typeId}&dueDate=${dueDateMoment}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&hasMembers=1`;

            dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_PROJECT_LIST", list: [] });

            if (projectProgress) {
                fetchUrl += `&projectProgress=${projectProgress}`;
            }
            if (typeId === "Innactive/Archived") {
                fetchUrl += `&isDeleted=1&projectType=${projectType}`;
            } else {
                fetchUrl += `&isActive=1`;
            }

            getData(fetchUrl, {}, c => {
                dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_PROJECT_LOADING", Loading: false });
            });
        }
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_FILTER", filter: { [name]: e } });
    }

    render() {
        const { type, project, dispatch, loggedUser } = this.props;
        const { Filter } = { ...project };
        const projectTypes = _(type.List)
            .filter(o => {
                return o.linkType == "project";
            })
            .map(o => {
                return { id: o.id, name: o.type };
            })
            .value();
        const projectProcessOptions = [{ id: "All", name: "All" }, { id: "On Time", name: "On Time" }, { id: "Issues", name: "Issues" }];
        const projectTypeOptions = [{ id: 1, name: "Client" }, { id: 2, name: "Internal" }, { id: 3, name: "Private" }];
        return (
            <div class="container-fluid filter">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            {_.map(projectTypes, (projectType, index) => {
                                return (
                                    <div class="flex-col" key={index}>
                                        <a class={projectType.id == project.Filter.typeId ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("typeId", projectType.id)}>
                                            {projectType.name}
                                        </a>
                                    </div>
                                );
                            })}
                            <div class="flex-col">
                                <a class={project.Filter.typeId === "Innactive/Archived" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("typeId", "Innactive/Archived")}>
                                    Innactive/Archived
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
                            {project.Filter.typeId === "Innactive/Archived" ? (
                                <DropDown multiple={false} required={false} options={projectTypeOptions} selected={Filter.projectType} onChange={e => this.setDropDown("projectType", e.value)} />
                            ) : (
                                <DropDown multiple={false} required={false} options={projectProcessOptions} selected={Filter.projectProgress} onChange={e => this.setDropDown("projectProgress", e.value)} />
                            )}
                            {loggedUser.data.userRole <= 4 && (
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
