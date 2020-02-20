import React from "react";
import { connect } from "react-redux";
import { postData } from "../../globalFunction";
import { Editor } from '@tinymce/tinymce-react';

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        Login: store.login
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
        const { Login, ipAddress } = { ...this.props }
        postData(`/termsAndConditions`, { ...Login, termsAndConditions: 1, ipAddress }, (termsAndConditionsResponse) => {
            const { userDetails } = { ...termsAndConditionsResponse.data }
            if (userDetails.projectId.length > 1 || userDetails.userRole <= 4) {
                window.location.replace("/");
            } else {
                window.location.replace(`/account#/projects/${userDetails.projectId[0]}`);
            }
        })
    }
    handleClose() {
        this.setState({ accept: false })
        $(`#termsAndCondition`).modal("hide");
    }

    render() {
        const { accept } = { ...this.state }
        const { termsAndConditions } = { ...this.props };
        return (
            <div class="modal fade delete-modal" id="termsAndCondition">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content br10">
                        <div class="modal-body">
                            <h1>Terms of Use and Privacy Policy</h1>
                            {typeof termsAndConditions !== "undefined" &&
                                <div class="mt20 terms-and-conditions">
                                    <Editor
                                        class="tcEditor"
                                        apiKey="pqgfoi8qj6k0rua9o2fqgebi47b6obcpg6o7n94wo5wcnr2z"
                                        initialValue={termsAndConditions}
                                        readOnly={true}
                                        init={{
                                            menubar: false,
                                            readonly: true,
                                            statusbar: false,
                                            toolbar: false,
                                            plugins: "autoresize",
                                            inline_boundaries: false,
                                            editor_deselector: "readonly"
                                        }}
                                    />
                                    <div class='mt10 text-right'>
                                        <label class="custom-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={accept}
                                                onChange={() => this.setState({ accept: !this.state.accept })}
                                                onClick={f => () => { }}
                                            />
                                            <span class="checkmark" />
                                            <span>  I have read and agree to the Terms of Use and Privacy Policy </span>
                                        </label>
                                    </div>
                                </div>
                            }
                            <div class="d-flex-between mt20 w100">
                                <button type="button" class="btn btn-violet m0" onClick={this.handleClose}>Close</button>
                                {accept &&
                                    <button type="button" class="btn btn-violet m0" onClick={this.handleSubmit}>Submit</button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default TermsAndConditions