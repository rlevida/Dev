import React from "react";
import { Loading } from "../../../globalComponents";
import { getData, postData, putData, showToast, getParameterByName } from '../../../globalFunction';
import DocumentContainer from './documentContainer';
import FolderContainer from './folderContainer';
import { connect } from "react-redux"
import { withRouter } from "react-router";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class DocumentNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            order: 'asc',
        }
    }

    renderFolder(data){
        return <FolderContainer data={data} />
    }

    render() {
        const { document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        console.log(this.props)
        return (
            <div class="mb20">
                <div class="col-lg-6 col-md-6">
                    <table class="table-document mb40">
                        <thead>
                            <tr>
                                <th scope="col" class="td-left" >File Name</th>
                                <th scope="col">Uploaded By</th>
                                <th scope="col">Upload Date</th>
                                <th scope="col">Workstream</th>
                            </tr>
                        </thead>
                        <tbody>
                            {document.Loading === "" &&
                                _.orderBy(document.List, ['dateAdded'], ['desc']).map((data, index) => {
                                    return (
                                        <DocumentContainer
                                            data={data}
                                            index={index}
                                            key={index}
                                            moveTo={(folderData, documentData) => this.moveTo(folderData, documentData)}
                                        />
                                    )
                                })
                            }
                        </tbody>
                    </table>
                    <div class="text-center">
                        {
                            ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                        }
                    </div>
                    {
                        ((_.isEmpty(Count) === false) && document.Loading === "RETRIEVING") && <Loading />
                    }
                    {
                        (document.List.length === 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                    }
                </div>
                <div class="col-lg-6 col-md-6">
                    {_.orderBy(folder.List, ['dateAdded'], ['desc']).map((data, index) => {
                        return (
                            this.renderFolder(data)
                        )
                    })}
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentNew);