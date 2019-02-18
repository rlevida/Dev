import React from "react";

import Header from "../partial/header";
import Form from "./form";
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
        const { workstream } = this.props;
        const Component = <div>
            {
                (workstream.FormActive == "List") &&
                <div class="row">
                    <div class="col-md-12">
                        <div class="card">
                            <div class="mb20 bd">
                                <div class="container-fluid filter mb20">
                                    <div class="row content-row">
                                        <div class="col-md-12">
                                            <div class="add-action">
                                                <WorkstreamFilter />
                                                <a class="btn btn-default">
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

            {workstream.FormActive == "Form" &&
                <Form />
            }

        </div>
        return (
            <Header component={Component} page={"Workstream"} />
        )
    }
}