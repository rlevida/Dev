import React from "react";
import { connect } from "react-redux";

import { DropDown } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        status: store.status,
        loggedUser: store.loggedUser,
        type: store.type,
        project: store.project
    }
})

export default class ProjectActionTab extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser } = this.props;

        if (_.isEqual(prevProps.project.Filter, this.props.project.Filter) == false) {
            const { typeId, projectStatus } = this.props.project.Filter;
            const dueDateMoment = moment().format("YYYY-MM-DD");
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_PROJECT_LIST", list: [] });

            getData(`/api/project?page=1&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}`, {}, (c) => {
                dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_PROJECT_LOADING", Loading: false });
                showToast("success", "Project successfully retrieved.");
            });
        }
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_FILTER", filter: { [name]: e } });
    }

    render() {
        const { type, project, dispatch } = this.props;
        const { Filter } = { ...project }
        const projectTypes = _(type.List).filter((o) => { return o.linkType == "project" }).map((o) => { return { id: o.id, name: o.type } }).value();
        const statusList = [
            { id: "All", name: "All Status" },
            { id: "Active", name: "Active" },
            { id: "On Time", name: "On Time" },
            { id: "Issues", name: "Issues" }
        ];


        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            {
                                _.map(projectTypes, (projectType, index) => {
                                    return (<div class="flex-col" key={index}>
                                        <a class={(projectType.id == project.Filter.typeId) ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("typeId", projectType.id)}>{projectType.name}</a>
                                    </div>)
                                })
                            }
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="button-action">
                            <DropDown multiple={false}
                                required={false}
                                options={statusList}
                                selected={Filter.projectStatus}
                                onChange={(e) => this.setDropDown("projectStatus", e.value)} />
                            <a class="btn btn-default" onClick={(e) => {
                                dispatch({ type: "SET_PROJECT_SELECTED", Selected: { isActive: 1 } });
                                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
                            }}
                            >
                                <span>
                                    <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                    Add New Project
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}