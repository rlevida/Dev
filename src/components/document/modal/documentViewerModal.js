import React from "react";
import moment from 'moment';
import mime from "mime-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { getFilePathExtension, putData, showToast, postData, removeTempFile, getData } from '../../../globalFunction';
import DocumentComment from "../comment/";

var delayTimer = ''

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        settings: store.settings,
        conversation: store.conversation,
        global: store.global,
        starred: store.starred,
        project: store.project
    }
})

class DocumentViewerComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            comment: "",
            contributors: [],
            suggestions: [],
            mentions: [],
            reminderList: []
        }
        this.handleOnChange = this.handleOnChange.bind(this)
        this.downloadDocument = this.downloadDocument.bind(this)
    }
    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: "" })
    }
    fetchData(page) {
        const { dispatch, match } = this.props;
        getData(`/api/conversation/getConversationList?linkType=document&linkId=${match.params.documentId}`, {}, (c) => {
            dispatch({ type: 'SET_COMMENT_LIST', list: c.data.result })
        })
    }

    deleteDocument(id) {
        const { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${id}`, { status: 'archived' }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", id: id })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: 'List' })
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            })
        }
    }

    printDocument(file) {
        const dataToSubmit = { fileName: file.name, fileOrigin: file.origin };
        postData(`/api/document/printDocument`, dataToSubmit, (c) => {
            document.getElementById("printDocument").src = `/temp/${c.data}`;
            setTimeout(() => {
                document.getElementById('printDocument').contentWindow.print();

                let onFocus = true
                window.onfocus = function () {
                    if (onFocus) {
                        removeTempFile(c.data, (c) => { onFocus = false })
                    }
                }
            }, 2000)
        })
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    handleOnChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_COMMENT_FILTER', filter: { [e.target.name]: e.target.value } });
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${projectId}&document=${origin}`, {
            linkType: "document",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedDocumentList = _.map(document.Selected.status === 'new' ? [...document.New] : [...document.Library], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, DocumentType: document.Selected.status === 'new' ? 'New' : 'Library' });
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${projectId}&document=${origin}`, {
            linkType: "document",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedDocumentList = _.map([...document.List], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, count: document.Count });
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }
    render() {
        const { dispatch, document, settings, conversation, history, project } = this.props;
        let isDocument = true, ext = "", documentContentType = "";

        if (typeof document.Selected.id !== 'undefined') {
            ext = getFilePathExtension(document.Selected.name).toLowerCase();
            documentContentType = mime.contentType(document.Selected.name);

            if (ext == "jpeg" || ext == "png" || ext == "jpg") {
                isDocument = "image";
            }
            if (ext == "pdf") {
                isDocument = "pdf";
            }
        }
        return (
            <div class="modal fade" id="documentViewerModal" tabIndex="-1" role="dialog" aria-labelledby="documentViewerModal" aria-hidden="true" data-backdrop="static" data-keyboard="false">
                <div class="modal-lg modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="row display-flex vh-center">
                                <div class="col-md-6 display-flex">
                                    <a class="text-grey" data-dismiss="modal" aria-label="Close">
                                        <span>
                                            <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                            <strong>Back</strong>
                                        </span>
                                    </a>
                                </div>
                                <div class="col-md-6 modal-action">
                                    <div class="button-action">
                                        <a class="logo-action text-gold" onClick={() => this.starredDocument({ isStarred: document.Selected.isStarred, id: document.Selected.id, origin: document.Selected.origin })}>
                                            <i class={`fa ${document.Selected.isStarred ? "fa-star" : "fa-star-o"}`} title="STARRED" aria-hidden="true" />
                                        </a>
                                        <a class="logo-action text-grey" onClick={() => this.downloadDocument(document.Selected)}>
                                            <i title="DOWNLOAD" class="fa fa-download" aria-hidden="true"></i>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            (typeof document.Selected.id !== 'undefined') &&
                            <div class="modal-body">
                                <h2 class="mt20 mb20">
                                    {
                                        (document.Selected.origin).substring(0, 40)
                                    }
                                    {((document.Selected.origin).length > 40) ? "..." : ""}
                                </h2>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="label-div">
                                            <label>Uploaded By:</label>
                                            <div>
                                                <div class="profile-div">
                                                    <div class="thumbnail-profile">
                                                        <img src={document.Selected.user.avatar} alt="Profile Picture" class="img-responsive" />
                                                    </div>
                                                    <p class="m0">{document.Selected.user.firstName + " " + document.Selected.user.lastName}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="label-div">
                                            <label>Upload Date:</label>
                                            <p class="m0">{moment(document.Selected.dateAdded).format('MMMM DD, YYYY')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div id="documentImage" class="mt20">
                                    <div class="label-div">
                                        <label>File Preview:</label>
                                    </div>
                                    {
                                        (isDocument == true) &&
                                        <iframe
                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${settings.imageUrl}/upload/${document.Selected.name}`}
                                            width='100%' height='623px' frameBorder='0'>
                                            This is an embedded
                                            <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>
                                        </iframe>
                                    }
                                    {
                                        (isDocument == "image") && <div>
                                            <img class="img-responsive" src={`${settings.imageUrl}/upload/${document.Selected.name}`} />
                                        </div>

                                    }
                                    {
                                        (isDocument == "pdf") && <embed src={`${settings.imageUrl}/upload/${document.Selected.name}`} type={documentContentType} width='100%' height='623px'></embed>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentViewerComponent)