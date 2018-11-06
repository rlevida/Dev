import React from "react";
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DropDown, Loading } from "../../../globalComponents"
import { postData, showToast } from '../../../globalFunction'

import { connect } from "react-redux"

@DragDropContext(HTML5Backend)

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users: store.users,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        projectData: store.project,
        folder: store.folder

    }
})


export default class ShareModal extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        // automatically move to selected folder
        if (folderParams != "" && folderParamsType == "library") {
            let folderSelectedInterval = setInterval(() => {
                if (this.props.folder.List.length > 0) {
                    clearInterval(folderSelectedInterval)
                    let folderData = this.props.folder.List.filter(e => e.id == folderParams)
                    if (folderData.length > 0) {
                        this.props.dispatch({ type: "SET_LIBRARY_FOLDER_SELECTED", Selected: folderData[0] })
                    }
                }
            }, 1000)
        }
    }

    selectShare(e, data) {
        let { dispatch, document } = this.props;
        let Selected = Object.assign({}, document.Selected);
        Selected["share"] = JSON.stringify(e)
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    share() {
        let { socket, document, loggedUser } = this.props;
        let dataToSubmit = {
            users: document.Selected.share,
            linkType: "project",
            linkId: project,
            shareType: document.Selected.isFolder ? "folder" : "document",
            shareId: document.Selected.id,
            sharedBy: loggedUser.data.id
        }

        postData(`/api/share/`, dataToSubmit, (c) => {
            if (c.status == 200) {
                showToast("success", "Successfully Shared.");
            } else {
                showToast("danger", "Sharing failed. Please try again.");
            }
        })
    }

    render() {
        let { document, global } = this.props;
        let shareOptions = []

        if (typeof global.SelectList.projectMemberList != "undefined") { // FOR SHARE OPTIONS
            global.SelectList.projectMemberList.map(e => {
                if (e.userType == "External") {
                    shareOptions.push({ id: e.id, name: `${e.firstName} ${e.lastName}` })
                }
            })
        }

        return <div>

            <div class="modal fade" id="shareModal" tabIndex="-1" role="dialog" aria-labelledby="shareModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="shareModal">Share</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <div class="col-md-12 col-xs-12">
                                    <DropDown
                                        name="share"
                                        multiple={true}
                                        required={false}
                                        options={shareOptions}
                                        selected={(document.Selected.share != null) ? JSON.parse(document.Selected.share) : []}
                                        onChange={(e) => this.selectShare(e, document.Selected)}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                            <br />
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            {(document.Selected.share != null) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.share()}>Share</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}