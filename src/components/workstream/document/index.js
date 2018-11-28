import React from "react";
import List from "./list"
import Form from "./form"
import { connect } from "react-redux"
@connect((store) => {
    return {
        document: store.document,
    }
})
export default class WorkstreamDocumentViewer extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { document } = this.props;
        return (
            <div>
                { (document.FormActive == "List") && 
                    <List/>
                }
                { (document.FormActive == "Form") && 
                    <Form/>
                }
            </div>
        )
    }
}