import React from "react";
import moment from "moment";
import mime from "mime-types";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { getFilePathExtension, putData, showToast, postData } from "../../../globalFunction";
import DocumentComment from "../comment/";

@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        settings: store.settings,
        conversation: store.conversation,
        global: store.global,
        starred: store.starred,
        project: store.project,
        starred: store.starred
    };
})
class DocumentViewerComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
            contributors: [],
            suggestions: [],
            mentions: [],
            reminderList: []
        };
        _.map(["downloadDocument", "handleOnChange", "deleteDocument", "downloadDocument", "starredDocument"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };
        $("#documentViewerModal").on("hidden.bs.modal", () => {
            const { history } = { ...this.props };
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            dispatch({ type: "CLEAR_COMMENT" });
        });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_COMMENT_SELECTED", Selected: "" });
    }

    deleteDocument(id) {
        const { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${id}`, { status: "archived" }, c => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: id });
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            });
        }
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    handleOnChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_COMMENT_FILTER", filter: { [e.target.name]: e.target.value } });
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch, match, starred } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = isStarred > 0 ? 0 : 1;

        postData(
            `/api/starred?projectId=${projectId}&document=${origin}`,
            {
                linkType: "document",
                linkId: id,
                usersId: loggedUser.data.id
            },
            c => {
                if (c.status == 200) {
                    let selectedObj = { ...document.Selected, isStarred: isStarredValue };
                    const updatedDocumentList = _.map(document.List, (documentObj, index) => {
                        if (id == documentObj.id) {
                            documentObj["isStarred"] = isStarredValue;
                        }
                        return documentObj;
                    });
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
                    dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, count: document.Count });
                    showToast("success", `Document successfully ${isStarredValue > 0 ? "starred" : "unstarred"}.`);

                    if (isStarredValue === 0) {
                        const starredDocument = _.find(starred.List, { linkId: document.Selected.id, linkType: "document" });
                        const starredList = starred.List.filter(e => {
                            return starredDocument.id !== e.id;
                        });
                        dispatch({ type: "SET_STARRED_LIST", list: starredList });
                    }
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            }
        );
    }

    render() {
        const { document, settings } = this.props;
        let isDocument = true,
            ext = "",
            documentContentType = "";

        if (typeof document.Selected.id !== "undefined") {
            ext = getFilePathExtension(document.Selected.name).toLowerCase();
            documentContentType = mime.contentType(document.Selected.name);

            if (ext == "jpeg" || ext == "png" || ext == "jpg") {
                isDocument = "image";
            }
            if (ext == "pdf") {
                isDocument = "pdf";
            }
        }

        let url = `${settings.site_url}api/file/upload/${document.Selected.name}?Token=${settings.token}`;
        return (
            <div class="modal fade" id="documentViewerModal" tabIndex="-1" role="dialog" aria-labelledby="documentViewerModal" aria-hidden="true" data-backdrop="static" data-keyboard="false">
                <div class="modal-lg modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div class="row display-flex vh-center">
                                <div class="col-md-6 display-flex">
                                    <a class="text-grey" data-dismiss="modal" aria-label="Close">
                                        <span>
                                            <i class="fa fa-chevron-left mr10" aria-hidden="true" />
                                            <strong>Back</strong>
                                        </span>
                                    </a>
                                </div>
                                <div class="col-md-6 modal-action">
                                    <div class="button-action">
                                        <a class="logo-action text-grey" onClick={() => this.starredDocument({ isStarred: document.Selected.isStarred, id: document.Selected.id, origin: document.Selected.origin })}>
                                            <i class={`fa ${document.Selected.isStarred ? "fa-star text-yellow" : "fa-star-o"}`} title="STARRED" aria-hidden="true" />
                                        </a>
                                        <a class="logo-action text-grey" onClick={() => this.downloadDocument(document.Selected)}>
                                            <i title="DOWNLOAD" class="fa fa-download" aria-hidden="true" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {typeof document.Selected.id !== "undefined" && (
                            <div class="modal-body">
                                <h2 class="mt20 mb20">
                                    {document.Selected.origin.substring(0, 40)}
                                    {document.Selected.origin.length > 40 ? "..." : ""}
                                </h2>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="label-div">
                                            <label>Uploaded By:</label>
                                            <div>
                                                <div class="profile-div">
                                                    <div class="thumbnail-profile">
                                                        <img
                                                            src={`${settings.site_url}api/file/profile_pictures/${document.Selected.user.avatar}`}
                                                            alt="Profile Picture" class="img-responsive" />
                                                    </div>
                                                    <p class="m0">{document.Selected.user.firstName + " " + document.Selected.user.lastName}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="label-div">
                                            <label>Upload Date:</label>
                                            <p class="m0">{moment(document.Selected.dateAdded).format("MMMM DD, YYYY")}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-8">
                                        <div id="documentImage" class="mt20">
                                            <div class="label-div">
                                                <label>File Preview:</label>
                                            </div>
                                            {isDocument == true && (
                                                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${url}`} width="100%" height="623px" frameBorder="0">
                                                    This is an embedded
                                                    <a target="_blank" href="http://office.com">
                                                        Microsoft Office
                                                    </a>{" "}
                                                    document, powered by{" "}
                                                    <a target="_blank" href="http://office.com/webapps">
                                                        Office Online
                                                    </a>
                                                </iframe>
                                            )}
                                            {isDocument == "image" && (
                                                <div>
                                                    <img class="img-responsive" src={`${url}`} />
                                                </div>
                                            )}
                                            {isDocument == "pdf" && <embed src={`${settings.imageUrl}/upload/${document.Selected.name}`} type={documentContentType} width="100%" height="623px" />}
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="label-div mt20">
                                            <label>Comments:</label>
                                        </div>
                                        <DocumentComment />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DocumentViewerComponent);
