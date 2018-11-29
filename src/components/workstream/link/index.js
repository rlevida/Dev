import React from "react";
import { connect } from "react-redux";
import List from "./list";

@connect((store) => {
    return {
        workstream: store.workstream
    }
})
export default class Component extends React.Component {
    render() {
        let { workstream } = this.props

        return (
            <div>
                <h4 style={{ paddingLeft: "25px" }}>{workstream.Selected.workstream}</h4>
                <List />
            </div>
        )
    }
}