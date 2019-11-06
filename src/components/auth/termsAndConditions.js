import React from "react";
import { connect } from "react-redux";
import { putData } from "../../globalFunction";
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertFromRaw } from 'draft-js';

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
    }
})
class TermsAndConditions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            accept: false
        }
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleClose = this.handleClose.bind(this)
    }
    handleSubmit() {
        const { userDetails } = { ...this.props }
        putData(`/api/user/termsAndConditions/${userDetails.id}`, { termsAndConditions: 1 }, () => {
            if (userDetails.projectId.length > 1 || userDetails.userRole <= 4) {
                window.location.replace("/");
            } else {
                window.location.replace(`/account#/projects/${userDetails.projectId[0]}`);
            }
        })
    }
    handleClose() {
        window.location.replace("/");
    }

    render() {
        const { accept } = { ...this.state }
        const { termsAndConditions } = { ...this.props }
        return (
            <div class="modal fade delete-modal" id="termsAndCondition">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            {typeof termsAndConditions !== "undefined" &&
                                <div>
                                    <Editor editorState={EditorState.createWithContent(convertFromRaw(JSON.parse(termsAndConditions)))} readOnly toolbarHidden={true} />
                                    <div class="d-flex-between mt20">
                                        <label class="custom-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={accept}
                                                onChange={() => this.setState({ accept: !this.state.accept })}
                                                onClick={f => () => { }}
                                            />
                                            <span class="checkmark" />
                                            I have read and agree to the Terms and Conditions and Privacy Policy
                                        </label>
                                    </div>
                                    <div class="d-flex-between mt20">
                                        <button type="button" class="btn btn-primary m0" onClick={this.handleClose}>Close</button>
                                        {accept &&
                                            <button type="button" class="btn btn-primary m0" onClick={this.handleSubmit}>Submit</button>
                                        }
                                    </div>
                                </div>
                            }

                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TermsAndConditions