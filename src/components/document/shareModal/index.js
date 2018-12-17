import React from "react";
import { connect } from "react-redux"

import { DropDown } from "../../../globalComponents"
import { postData, showToast } from '../../../globalFunction'

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        global: store.global,
    }
})

export default class ShareModal extends React.Component {
    constructor(props) {
        super(props)
    }

    selectShare(e) {
        const { dispatch, document } = this.props;
        const Selected = Object.assign({}, document.Selected);

        Selected["share"] = JSON.stringify(e)
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    share() {
        const { dispatch, document, loggedUser } = this.props;
        const dataToSubmit = {
            users: document.Selected.share,
            linkType: "project",
            linkId: project,
            shareType: document.Selected.type,
            shareId: document.Selected.id,
            sharedBy: loggedUser.data.id,
            projectId: project,
            usersId: loggedUser.data.id,
            oldDocument: document.Selected.origin,
            newDocument: '',
            actionType: 'shared',
            title: `Document shared to ${JSON.parse(document.Selected.share).map((e) => { return e.label }).join(',')}`
        }

        postData(`/api/share`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data.result, Status: document.Selected.status })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Shared.");
            } else {
                showToast("danger", "Sharing failed. Please try again.");
            }
        })
    }

    render() {
        const { document, global } = this.props;
        let shareOptions = [];

        if (typeof global.SelectList.projectMemberList != "undefined") {
            global.SelectList.projectMemberList.map(e => {
                if (e.userType == "External") {
                    shareOptions.push({ id: e.id, name: `${e.firstName} ${e.lastName}` })
                }
            })
        }

        return (
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
                                        onChange={(e) => this.selectShare(e)}
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
        )
    }
}