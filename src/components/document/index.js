import React from "react"
import parallel from 'async/parallel';
import { connect } from "react-redux"
import { getData } from "../../globalFunction"
import { Route, Switch } from 'react-router-dom';
import DocumentViewer from "../document/documentViewer"
import DocumentUpload from "../document/documentUpload"
import Form from "./form"
import List from "./list"

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        project: store.project
    }
})
export default class DocumentComponent extends React.Component {
    constructor(props) {
        super(props)
    }
    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: 'CLEAR_DOCUMENT' });
    }
    componentDidMount() {
        const { dispatch, project } = this.props
        dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: {} });
        dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'List' });

        parallel({
            shareList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=shareList&linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'shareList' })
                    parallelCallback(null, "")
                })
            },
            projectMemberListGlobal: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project.Selected.id}&linkType=project`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
                    parallelCallback(null, "")
                })
            },
            workstreamList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project.Selected.id}`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
                    parallelCallback(null, "")
                })
            },
            taskList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project.Selected.id}`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
                    parallelCallback(null, "")
                })
            },
            members: (parallelCallback) => {
                getData(`/api/member?linktype=project&linkId=${project.Selected.id}`, {}, (c) => {
                    dispatch({ type: "SET_MEMBERS_LIST", list: c.data.result, count: {} })
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {
        })
    }

    render() {
        const { document, match } = this.props
        const Component = <div>
            {(document.FormActive === "List") && <Switch>
                <Route exact={true} path={`${match.path}`} component={List} />
                <Route path={`${match.path}/:documentId`} component={DocumentViewer} />
            </Switch>
            }
            {(document.FormActive === "Form") &&
                <Form />
            }
            {document.FormActive === "Upload" &&
                <DocumentUpload />
            }
        </div>
        return (
            Component
        )
    }
}