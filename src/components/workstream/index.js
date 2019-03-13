import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from 'react-router-dom';

import WorkstreamList from './workstreamList';
import WorkstreamDetails from './workstreamDetails';
import WorkstreamForm from './workstreamForm';

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
        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
    }

    render() {
        const { workstream } = { ...this.props };
        return (
            <div>
                {
                    (workstream.FormActive == "Form") && <WorkstreamForm />
                }
                {
                    (workstream.FormActive == "List") && <Switch>
                        <Route exact={true} path={`${this.props.match.path}`} component={WorkstreamList} />
                        <Route path={`${this.props.match.path}/:workstreamId`} component={WorkstreamDetails} />
                    </Switch>
                }
            </div>
        )
    }
}