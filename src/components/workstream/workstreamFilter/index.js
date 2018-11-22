import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { DropDown } from "../../../globalComponents";
import { getData, showToast } from "../../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        type: store.type
    }
})

export default class ProjectFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser } = this.props;

        if (_.isEqual(prevProps.workstream.Filter, this.props.workstream.Filter) == false) {
            const { typeId, workstreamStatus, workstream } = this.props.workstream.Filter;
            const dueDateMoment = moment().format("YYYY-MM-DD");

            getData(`/api/workstream?projectId=${project}&page=1&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}&typeId=${typeId}&workstreamStatus=${workstreamStatus}&dueDate=${dueDateMoment}&workstream=${workstream}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
                    showToast("success", "Workstream successfully retrieved.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
                dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
                keyTimer && clearTimeout(keyTimer);
            });
        }
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        
        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
        dispatch({ type: "SET_WORKSTREAM_FILTER", filter: { [name]: e } });
    }

    handleChange(e) {
        const { dispatch } = this.props;
        const filterState = { [e.target.name]: e.target.value };

        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "EMPTY_WORKSTREAM_LIST" });

        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            dispatch({ type: "SET_WORKSTREAM_FILTER", filter: filterState });
        }, 1500)
    }

    render() {
        const { workstream, type } = this.props;
        const { Filter } = { ...workstream }
        const typeList = [
            { id: "", name: "All Workstream Types" },
            ..._(type.List)
                .filter((e, i) => {
                    return e.linkType == "workstream"
                })
                .map((e, i) => { return { id: e.id, name: e.type } })
                .value()
        ];
        const statusList = [
            { id: "All", name: "All Status" },
            { id: "Active", name: "Active" },
            { id: "On Time", name: "On Time" },
            { id: "Issues", name: "Issues" }
        ];

        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-4 mb5">
                        <label>Workstream Type</label>
                        <DropDown multiple={false}
                            required={false}
                            options={typeList}
                            selected={Filter.typeId}
                            onChange={(e) => this.setDropDown("typeId", e.value)} />
                    </div>
                    <div class="col-md-4 mb5">
                        <label>Workstream Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={Filter.workstreamStatus}
                            onChange={(e) => this.setDropDown("workstreamStatus", e.value)} />
                    </div>
                    <div class="col-md-4 mb5">
                        <label>Workstream</label>
                        <input type="text" name="workstream" class="form-control" onChange={this.handleChange} />
                    </div>
                </div>
            </div>
        )
    }
}