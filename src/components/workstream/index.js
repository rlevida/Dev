import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import WorkstreamList from './workstreamList';
import WorkstreamDetails from './workstreamDetails';

@connect((store) => {
    return {
        workstream: store.workstream
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_LIST", list: [], Count: {} });
    }
    render() {
        return (
            <div>
                <Switch>
                    <Route exact={true} path={`${this.props.match.path}`} component={WorkstreamList} />
                    <Route path={`${this.props.match.path}/:workstreamId`} component={WorkstreamDetails} />
                </Switch>
            </div>
        )
    }
}