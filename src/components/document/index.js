import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
import DocumentViewer from "../document/modal/documentViewerModal";
import DocumentUpload from "../document/documentUpload";
import Form from "./form";
import List from "./list";

@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        project: store.project
    };
})
export default class DocumentComponent extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "CLEAR_DOCUMENT" });
        dispatch({ type: "SET_DOCUMENT_ACTIVE_TAB", active: "" });
        dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
        dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
        dispatch({ type: "SET_FOLDER_LIST", list: [] });
        dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
    }
    componentDidMount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_DOCUMENT_ACTIVE_TAB", active: "active" });
    }

    render() {
        const { document, match } = this.props;
        const Component = (
            <div>
                {document.FormActive === "List" && (
                    <Switch>
                        <Route exact={true} path={`${match.path}`} component={List} />
                        <Route path={`${match.path}/:documentId`} component={DocumentViewer} />
                    </Switch>
                )}
                {document.FormActive === "Form" && <Form />}
                {document.FormActive === "Upload" && <DocumentUpload />}
            </div>
        );
        return Component;
    }
}
