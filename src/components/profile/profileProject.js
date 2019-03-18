import React from "react";
import _ from "lodash";

import { connect } from "react-redux";
import { getData } from "../../globalFunction";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        project: store.project
    }
})
export default class ProfileProject extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "getList",
            "getNext"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        this.getList(1);
    }

    getList(page) {
        const { dispatch, loggedUser } = { ...this.props };
        let fetchUrl = `/api/project?page=${page}&userId=${loggedUser.data.id}`;
        getData(fetchUrl, {}, (c) => {
            console.log(c)
        });
    }

    getNext() {

    }

    render() {
        const { project } = { ...this.props };
        const { Loading, List } = project;
        return (
            <div>
                <h4><strong>Project Involvement</strong></h4>
                <div class={(Loading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                </div>
            </div>
        )
    }
}