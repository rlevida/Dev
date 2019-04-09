import React from "react";
import { Loading } from "../../globalComponents";
import { getData, putData, showToast } from '../../globalFunction';
import { connect } from "react-redux"
import { withRouter } from "react-router";
import _ from "lodash"
import DocumentTemplate from "./template/notificationDocument"
import ArchivedModal from "./archiveModal"

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        notification: store.notification
    }
})

class DocumentList extends React.Component {
    constructor(props) {
        super(props)
    }

    async componentDidMount() {
        const { dispatch } = { ...this.props }
        await dispatch({ type: "SET_NOTIFICATION_LIST", list: [] });
        await this.fetchData(1)
    }

    fetchData(page) {
        const { dispatch, loggedUser, notification } = { ...this.props };
        const { List, Filter } = { ...notification };

        getData(`/api/notification?page=${page}&usersId=${loggedUser.data.id}&isArchived=${Filter.isArchived}&isDeleted=${Filter.isDeleted}`, {}, (c) => {
            const { count, result } = { ...c.data };
            dispatch({ type: 'SET_NOTIFICATION_LIST', list: List.concat(result), count: count });
        })
    }

    getNextResult() {
        const { notification } = { ...this.props };
        const { Count } = { ...notification };
        this.fetchData(Count.current_page + 1);
    }

    archive(data) {
        const { dispatch, loggedUser } = { ...this.props }
        putData(`/api/notification/archive/${data.id}?page=1&usersId=${loggedUser.data.id}&isRead=0&isDeleted=0&isArchived=0`, { isArchived: 1 }, (c) => {
            const { count, result } = { ...c.data };
            dispatch({ type: 'SET_NOTIFICATION_LIST', list: result, count: count });
            showToast('success', 'Successfully Archived.');
        })
    }

    render() {
        const { notification } = { ...this.props };
        const { Count, List } = { ...notification };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        return (
            <div>
                <div>
                    <div class="card-header">
                    </div>
                    <div>
                        <div class="card-body m0">
                            <ul class="n-list">
                                {_.orderBy(List, ['dateAdded'], ['desc']).map((e, i) => {
                                    switch (e.type) {
                                        case 'fileNewUpload': {
                                            return <div key={i}><DocumentTemplate data={e} index={i} archive={(data) => this.archive(data)} /></div>
                                        }
                                    }
                                })}

                            </ul>
                        </div>
                        {
                            ((currentPage != lastPage) && List.length > 0 && notification.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Notifications</a></p>
                        }
                        {
                            (notification.Loading == "RETRIEVING" && (List).length > 0) && <Loading />
                        }
                        {
                            (List.length === 0 && notification.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                        }
                    </div>
                </div>
                <ArchivedModal />
            </div>
        )
    }
}

export default withRouter(DocumentList);