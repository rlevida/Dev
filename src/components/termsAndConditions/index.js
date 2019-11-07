import React from "react";
import { connect } from "react-redux";
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import { getData, postData, putData, showToast } from "../../globalFunction";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        users: store.users
    };
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            reset: false,
            formData: {
                editorState: EditorState.createEmpty()
            }
        };
        this.onEditorStateChange = this.onEditorStateChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentWillMount() {
        getData(`/api/termsAndConditions`, {}, getTermsAndConditionsResponse => {
            try {
                if (getTermsAndConditionsResponse.data && getTermsAndConditionsResponse.data.termsAndConditions) {
                    const { termsAndConditions } = { ...getTermsAndConditionsResponse.data }
                    const convertRawResult = convertFromRaw(JSON.parse(termsAndConditions))
                    this.setState({
                        formData: {
                            ...getTermsAndConditionsResponse.data,
                            editorState: EditorState.createWithContent(convertRawResult)
                        }
                    });
                }
            } catch (err) {
                showToast('error', 'Something went wrong. Please try again.')
            }
        })

    }

    onEditorStateChange(editorState) {
        const { formData } = { ...this.state }
        this.setState({ formData: { ...formData, editorState } })
    }

    handleSubmit() {
        const { formData, reset } = { ...this.state }
        const { id, editorState } = { ...formData }
        const rawDraftContentState = JSON.stringify(convertToRaw(editorState.getCurrentContent()));
        if (id) {
            try {
                putData(`/api/termsAndConditions/${id}`, { termsAndConditions: rawDraftContentState, reset }, () => {
                    showToast('success', "Successfully updated.");
                })
            } catch (error) {
                showToast('error', 'Something went wrong. Please try again.')

            }
        } else {
            try {
                postData(`/api/termsAndConditions`, { termsAndConditions: rawDraftContentState, reset }, () => {
                    showToast('success', "Successfully updated.");
                })
            } catch (err) {
                showToast('error', 'Something went wrong. Please try again.')
            }
        }
    }


    render() {
        const { editorState, reset } = { ...this.state.formData }
        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <Editor
                            editorState={editorState ? editorState : EditorState.createEmpty()}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            onEditorStateChange={this.onEditorStateChange}
                            editorStyle={{ border: "1px solid #F1F1F1", padding: '5px' }}
                        />
                        <div class="d-flex-between mt20">
                            <label class="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={reset}
                                    onChange={() => { this.setState({ reset: !this.state.reset }) }}
                                    onClick={f => () => { }}
                                />
                                <span class="checkmark" />
                                Reset user terms and conditions?
                            </label>
                            <button type="button" class="btn btn-primary" onClick={this.handleSubmit}>Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
