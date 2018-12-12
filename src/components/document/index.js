import React from "react"
import parallel from 'async/parallel';
import { connect } from "react-redux"

import { getData } from "../../globalFunction"

import DocumentViewer from "./documentViewer"
import Header from "../partial/header"
import Form from "./form"
import List from "./list"

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { dispatch, loggedUser } = this.props

        if (documentId) {
            let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&documentId=${documentId}`;
            getData(requestUrl, {}, (c) => {
                if (c.status == 200) {
                    if (c.data.result.length > 0) {
                        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: c.data.result[0] });
                    }
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        }

        parallel({
            shareList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=shareList&linkId=${project}&linkType=project`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'shareList' })
                    parallelCallback(null, "")
                })
            },
            projectMemberListGlobal: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project}&linkType=project`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' })
                    parallelCallback(null, "")
                })
            },
            workstreamList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=workstreamList&projectId=${project}`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'workstreamList' })
                    parallelCallback(null, "")
                })
            },
            taskList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=taskList&projectId=${project}`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'taskList' })
                    parallelCallback(null, "")
                })
            },
            members: (parallelCallback) => {
                getData(`/api/member?linktype=project&linkId=${project}`, {}, (c) => {
                    dispatch({ type: "SET_MEMBERS_LIST", list: c.data.result, count: {} })
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {

        })
    }

    render() {
        let { document } = this.props
        let Component = <div>
            {(document.FormActive === "List" && documentId === '') &&
                <List />
            }
            {(document.FormActive === "Form" && documentId === '') &&
                <Form />
            }
            {document.FormActive === "DocumentViewer" &&
                <DocumentViewer />
            }
        </div>
        return (
            <Header component={Component} page={"document"} />
        )
    }
}