import React from "react";
import _ from "lodash";
import { connect } from "react-redux";

@connect((store) => {
    return {
        project: store.project
    }
})
export default class ProfileProject extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { project } = { ...this.props };
        const { Loading, List } = project;
        return (
            <div>
                <h3>Project Involvement</h3>
                <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                </div>
            </div>
        )
    }
}