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

export default class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);

        this.setDropDown = this.setDropDown.bind(this)
    }

    setDropDown(name, e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: e } });
    }

    render() {
        const { document, type } = this.props;
        const { Filter } = { ...document }
        const typeList = [
            { id: '', name: 'All Document Types' },
            { id: 'folder', name: 'Folder' },
            { id: 'document', name: 'document' },
        ];
        const statusList = [
            { id: 1, name: 'Completed' },
            { id: 0, name: 'Uncompleted' },
        ];

        return (
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-3 mb5">
                    <label>Document Type</label>
                        <a href="javascript:void(0)" title="New Folder" style={{ textDecoration: "none" }} onClick={() => this.setState({ folderAction: "create" })}><span class="fa fa-folder fa-3x"></span></a>
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Document Type</label>
                        <DropDown multiple={false}
                            required={false}
                            options={typeList}
                            selected={{}}
                            onChange={(e) => this.setDropDown("typeId", e.value)} />
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Document Status</label>
                        <DropDown multiple={false}
                            required={false}
                            options={statusList}
                            selected={{}}
                            onChange={(e) => this.setDropDown("workstreamStatus", e.value)} />
                    </div>
                    <div class="col-md-3 mb5">
                        <label>Tags</label>
                        <DropDown multiple={false}
                            required={false}
                            options={typeList}
                            selected={{}}
                            onChange={(e) => this.setDropDown("typeId", e.value)} />
                    </div>
                </div>
            </div>
        )
    }
}