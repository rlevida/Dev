import React from "react";
import List from "./list"
import { connect } from "react-redux"
@connect((store) => {
    return {
        document: store.document,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { document } = this.props;
        return (
            <div>
                <h1>test</h1>
                {/* { (document.FormActive == "List") && 
                    <List/>
                } */}
            </div>
        )
    }
}