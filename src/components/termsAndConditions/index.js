import React from "react";
import { connect } from "react-redux";
import { Editor } from '@tinymce/tinymce-react';
import { getData, postData, putData, showToast } from "../../globalFunction";
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
// import ClassicEditor from '../../ckeditor';

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
                editorState: ""
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
                    this.setState({
                        formData: {
                            ...getTermsAndConditionsResponse.data,
                            editorState: termsAndConditions
                        }
                    });
                }
            } catch (err) {
                showToast('error', 'Something went wrong. Please try again.')
            }
        })
    }

    // componentDidMount() {
    //     ClassicEditor
    //     .create( document.querySelector( '#editor' ) )
    //     .then( editor => {
    //         // window.editor = editor;
    //         console.log( 'Editor was initialized', editor ); 
    //     } )
    //     .catch( err => {
    //         console.error( err.stack );
    //     } );
    // }

    onEditorStateChange(editorState) {
        const { formData } = { ...this.state }
        this.setState({ formData: { ...formData, editorState } })
    }

    handleSubmit() {
        const { formData, reset } = { ...this.state }
        const { id, editorState } = { ...formData }
        if (id) {
            try {
                putData(`/api/termsAndConditions/${id}`, { termsAndConditions: editorState, reset }, () => {
                    showToast('success', "Successfully updated.");
                })
            } catch (error) {
                showToast('error', 'Something went wrong. Please try again.')

            }
        } else {
            try {
                postData(`/api/termsAndConditions`, { termsAndConditions: editorState, reset }, () => {
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
                            apiKey="pqgfoi8qj6k0rua9o2fqgebi47b6obcpg6o7n94wo5wcnr2z"
                            initialValue={editorState ? editorState : ""}
                            init={{
                                height: 600,
                                menubar: false,
                                statusbar: false,
                                toolbar: false,
                                plugins: [
                                    'advlist autolink lists link image charmap print preview anchor',
                                    'searchreplace visualblocks code fullscreen',
                                    'insertdatetime media table paste code help wordcount'
                                ],
                                toolbar:
                                    'undo redo | formatselect | bold italic backcolor | \
                                alignleft aligncenter alignright alignjustify | \
                                bullist numlist outdent indent | removeformat | help'
                            }}
                            onEditorChange={(e) => this.onEditorStateChange(e)}
                            toolbarClassName="toolbarClassName"
                            wrapperClassName="wrapperClassName"
                            editorClassName="editorClassName"
                            editorStyle={{ border: "1px solid #F1F1F1", padding: '20px' }}
                        />
                        <div class="mt20 text-right">
                            <div class="tc-checkbox mb10">
                                <span class="mr10"> Reset Terms of Use and Privacy Policy? </span>
                                <label class="custom-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={reset}
                                        onChange={() => { this.setState({ reset: !this.state.reset }) }}
                                        onClick={f => () => { }}
                                    />
                                    <span class="checkmark" />
                                </label>
                            </div>
                            <button type="button" class="btn btn-primary" onClick={this.handleSubmit}>Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
