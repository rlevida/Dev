import React from "react";
import { connect } from "react-redux";

import { DropDown } from "../../../globalComponents";
import { getData, showToast } from "../../../globalFunction";

@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
        loggedUser: store.loggedUser,
        type: store.type,
        project: store.project
    }
})

export default class ProjectFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
    }

    componentDidUpdate(prevProps) {
        const { dispatch } = this.props;

        if (_.isEqual(prevProps.project.Filter, this.props.project.Filter) == false) {
            const { typeId, projectStatus } = this.props.project.Filter;
            const dueDateMoment = moment().format("YYYY-MM-DD");
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_PROJECT_LIST", list: [] });

            getData(`/api/project?page=1&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`, {}, (c) => {
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
        const { type, project } = this.props;
        const { Filter } = { ...project }
        let typeList = [{ id: "", name: "All Project Types" }];
        const statusList = [
            { id: "All", name: "All Status" },
            { id: "Active", name: "Active" },
            { id: "On Time", name: "On Time" },
            { id: "Issues", name: "Issues" }
        ];
        type.List.map((e, i) => { if (e.linkType == "project") { typeList.push({ id: e.id, name: e.type }) } });

        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6 mb5">
                        <label>Project Type</label>
                        <DropDown multiple={false}
                            required={false}
                            options={typeList}
                            selected={Filter.typeId}
                            onChange={(e) => this.setDropDown("typeId", e.value)} />
                    </div>
                    <div class="col-md-6 mb5">
                        <label>Project Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={Filter.projectStatus}
                            onChange={(e) => this.setDropDown("projectStatus", e.value)} />
                    </div>
                </div>
            </div>
        )
    }
}