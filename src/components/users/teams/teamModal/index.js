import React from "react";
import { DropDown } from "../../../../globalComponents";
import { showToast, postData } from '../../../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        projectData: store.project,
        folder: store.folder

    }
})
export default class TeamModal extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { global } = this.props;
        return <div>
            <div class="modal fade" id="teamModal" tabIndex="-1" role="dialog" aria-labelledby="teamModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5 class="modal-title" id="teamModalLabel">
                                Team
                            </h5>
                        </div>
                        <div class="modal-body">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.handleSubmit()}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}