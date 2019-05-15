import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";
import { Searchbar, DropDown, Loading } from "../../globalComponents";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

let delayTimer = "";
let keyTimer = "";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        workstream: store.workstream
    }
})

class DocumentFilter extends React.Component {
    constructor(props) {
        super(props);
        _.map(["handleDate"], (fn) => { this[fn] = this[fn].bind(this) });
    }

    handleDate(date, name) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: date } });
    }

    render() {
        const { dispatch, document, workstream } = this.props;
        return (
            <div>
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                                <div class="flex-row tab-row mb0">
                                    <div class="flex-col">
                                        <a class="btn btn-default" onClick={(e) => e.preventDefault()}>Filter</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}>
                    <div class="card-body m0">
                        <div>
                            <label> Upload date:</label>
                            <div class="form-group input-inline">
                                <div>
                                    <label>
                                        From
                                </label>
                                </div>
                                <div>
                                    <DatePicker
                                        name="uploadFrom"
                                        dateFormat="MMMM DD, YYYY"
                                        onChange={date => {
                                            this.handleDate(date, 'uploadFrom');
                                        }}
                                        value={""}
                                        placeholderText="Select valid upload date"
                                        class="form-control"
                                        selected={null}
                                    />
                                </div>
                                <div class="ml10">
                                    <label>
                                        To
                                </label>
                                </div>
                                <div>
                                    <DatePicker
                                        name="uploadFrom"
                                        dateFormat="MMMM DD, YYYY"
                                        onChange={date => {
                                            this.handleDate(date, 'uploadTo');
                                        }}
                                        value={""}
                                        placeholderText="Select valid upload date"
                                        class="form-control"
                                        selected={null}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentFilter);