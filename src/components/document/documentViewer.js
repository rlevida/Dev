import React from "react";
import moment from 'moment';
import mime from "mime-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { getFilePathExtension, putData, showToast, postData, removeTempFile, getData } from '../../globalFunction';
import DocumentComment from "./comment";

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
    }

    componentDidMount() {
        const { dispatch, match, loggedUser } = this.props

        getData(`/api/document/detail/${match.params.documentId}`, {}, (c) => {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: c.data })
            if (c.data.document_read.length === 0) {
                const dataToSubmit = { usersId: loggedUser.data.id, documentId: c.data.id, isDeleted: 0 }
                postData(`/api/document/read`, dataToSubmit, (ret) => { })
            }
        })
    }

    componentWillMount() {
        const { document, match } = this.props
        if (match.params.documentId) {
            this.fetchData(1)
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "CLEAR_DOCUMENT" })
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: "" })
    }

    componentDidUpdate(prevProps) {
        const { dispatch, document } = this.props;

        if (_.isEqual(prevProps.conversation.Filter, this.props.conversation.Filter) == false) {
            clearTimeout(delayTimer);
            const { search } = this.props.conversation.Filter;
            let requestUrl = `/api/conversation/getConversationList?linkType=document&linkId=${document.Selected.id}`;

            delayTimer = setTimeout(() => {
                if (typeof search !== 'undefined' && search !== '') {
                    requestUrl += `&search=${search}`
                }
                getData(requestUrl, {}, (c) => {
                    dispatch({ type: 'SET_COMMENT_LIST', list: c.data })
                })
            }, 1000);
        }

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

    back() {

    }

    render() {
        const { dispatch, document, settings, conversation, history, project } = this.props;
        let isDocument = true, ext = "", documentContentType = "";

        if (typeof document.Selected.id !== 'undefined') {
            ext = getFilePathExtension(document.Selected.name).toLowerCase();
            documentContentType = mime.contentType(document.Selected.name)
            if (ext == "pdf" || ext == "jpeg" || ext == "png") {
                isDocument = false;
            }
        }

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                                        history.push(`/projects/${project.Selected.id}/files`)
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Document Viewer
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="mb20">
                                <div class="row">
                                    <div class="col-lg-8 col-md-8 col-xs-8" style={{ height: "100%" }}>
                                        <div id="documentImage" style={{ textAlign: "center", height: "100%" }}>
                                            {isDocument ?
                                                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${settings.imageUrl}/upload/${document.Selected.name}`}
                                                    width='100%' height='623px' frameBorder='0'>This is an embedded <a target='_blank' href='http://office.com'>Microsoft Office</a> document, powered by <a target='_blank' href='http://office.com/webapps'>Office Online</a>.
                                        </iframe>
                                                :
                                                <embed src={`${settings.imageUrl}/upload/${document.Selected.name}`} type={documentContentType} width={(ext == 'pdf' || ext == 'png') ? '100%' : "auto"} height={ext == 'pdf' ? '100%' : "auto"}></embed>
                                            }
                                        </div>
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-xs-12">
                                        <div class="row  m10 mb40">
                                            <div class="col-lg-10 col-md-10 col-xs-10">
                                                <input class="form-control" type="text" placeholder="Search" name='search' aria-label="Search" value={(typeof conversation.Filter.search !== 'undefined') ? conversation.Filter.search : ''} onChange={(e) => this.handleOnChange(e)} />
                                            </div>
                                            <div class="col-lg-2 col-md-2 col-xs-2">
                                                <div class="dropdown">
                                                    <button class="btn btn-default dropdown-toggle" type="button" id="documentViewerActions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                    <ul class="dropdown-menu  pull-right" aria-labelledby="documentViewerActions">
                                                        <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(document.Selected)}>Download</a></li>
                                                        <li>
                                                            <a onClick={() => this.starredDocument({ isStarred: document.Selected.isStarred, id: document.Selected.id, origin: document.Selected.origin })}>
                                                                {document.Selected.isStarred ? 'Unstarred' : 'Star'}
                                                            </a>
                                                        </li>
                                                        {/* <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(document.Selected.id)}>Delete</a></li> */}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row  m10">
                                            <div class="col-lg-12 col-md-12 col-xs-12">
                                                <span class="glyphicon glyphicon-file"></span>
                                                {typeof document.Selected.id !== 'undefined' && document.Selected.origin}
                                                <br />
                                                Uploaded by {typeof document.Selected.id !== 'undefined' && document.Selected.user.emailAddress}
                                                <br />
                                                {typeof document.Selected.id !== 'undefined' && moment(document.Selected.dateAdded).format('L')}
                                                <br />
                                                <h4>Comments</h4>
                                                <hr />
                                                <DocumentComment />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}


export default withRouter(DocumentViewerComponent)