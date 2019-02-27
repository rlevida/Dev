import React from "react";

import Header from "../partial/header";
import WorkstreamForm from "./workstreamForm";
import WorkstreamList from "./workstreamList";
import WorkstreamFilter from "./workstreamFilter";

import { connect } from "react-redux"
@connect((store) => {
    return {
        workstream: store.workstream,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }


    render() {
        const { workstream, dispatch } = this.props;
        const Component = <div>
            {
                (workstream.FormActive == "List") &&
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="mb20 bb">
                                <div class="container-fluid filter mb20">
                                    <div class="row content-row">
                                        <div class="col-md-12 col-sm-12">
                                            <div class="button-action">
                                                <WorkstreamFilter />
                                                <a class="btn btn-default" onClick={() => { dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" }) }}>
                                                    <span><i class="fa fa-plus mr10" aria-hidden="true"></i></span>
                                                    Add New Workstream
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class={(workstream.Loading == "RETRIEVING" && (workstream.List).length == 0) ? "linear-background" : ""}>
                                <WorkstreamList />
                            </div>
                        </div>
                    </div>
                </div>
            }

            {
                workstream.FormActive == "Form" && <div class="card form-card">
                    <div class="card-header">
                        <h4>
                            <a
                                class="text-white mr10"
                                onClick={() => {
                                    dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
                                }}
                            >
                                <i class="fa fa-chevron-left" aria-hidden="true"></i>
                            </a>
                            Add New Workstream
                            </h4>
                    </div>
                    <div class="card-body">
                        <WorkstreamForm />
                    </div>
                </div>
            }

        </div>
        return (
            <Header component={Component} page={"Workstream"} />
        )
    }
}