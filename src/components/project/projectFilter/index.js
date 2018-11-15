import React from "react"
import ReactDOM from "react-dom"

import { showToast, getData } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"

import { connect } from "react-redux"
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
        super(props)
        this.state = {
            projectStatus: "",
            typeId: ""
        }
        this.setDropDown = this.setDropDown.bind(this)
    }

    setDropDown(name, e) {
        const { dispatch, project } = this.props;
        const filter = { ...this.state, [name]: e }
        this.setState({ ...filter })
        let isActive = (filter.projectStatus != '') ? 1 : '';

        getData(`/api/project?&isActive=${isActive}&typeId=${filter.typeId}&page=${1}`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count })
            showToast("success", "Project successfully retrieved.");
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
        })
    }

    render() {
        let { status, type, loggedUser, dispatch } = this.props
        let typeList = [{ id: "", name: "All Project Types" }];
        let statusList = [
            { id: "", name: "All Status" },
            { id: "Active", name: "Active" },
            // {id:"On-Track",name:"On-track"},
            // {id:"Issues",name:"Issues"}
        ];
        type.List.map((e, i) => { if (e.linkType == "project") { typeList.push({ id: e.id, name: e.type }) } });


        return <div style={{ float: "left", minWidth: "40%", Width: "40%" }}>
            <div class="col-md-1">
                <span class="fa fa-filter"></span>
            </div>
            <div class="col-md-2">
                <span>Filters:</span>
            </div>
            <div class="col-md-4">
                <DropDown multiple={false}
                    required={false}
                    options={typeList}
                    selected={this.state.typeId}
                    onChange={(e) => this.setDropDown("typeId", e.value)} />
            </div>
            <div class="col-md-4">
                <DropDown multiple={false}
                    required={false}
                    options={statusList}
                    selected={this.state.projectStatus}
                    onChange={(e) => this.setDropDown("projectStatus", e.value)} />
            </div>
            {(loggedUser.data.userRole == 1
                || loggedUser.data.userRole == 2
                || loggedUser.data.userRole == 3
                || loggedUser.data.userRole == 4) &&
                <div class="col-md-1" >
                    <span class="fa fa-plus-circle" title="New Project" style={{ cursor: "pointer", fontSize: "20px", paddingTop: "8px" }}
                        onClick={(e) => {
                            dispatch({ type: "SET_PROJECT_SELECTED", Selected: { isActive: true } }),
                                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })
                        }
                        }>
                    </span>
                </div>
            }
        </div>
    }
}