import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, displayDateMD } from '../../globalFunction';

import { connect } from "react-redux"
import { withRouter } from "react-router";



import DocumentTemplate from "./template/notificationDocument"
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

    componentDidMount() {
        const { dispatch, match, loggedUser } = { ...this.props }
        getData(`/api/notification?usersId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "SET_NOTIFICATION_LIST", List: c.data })
        })

    }

    render() {
        const { notification } = { ...this.props };
        // const { Count } = { ...notifcation };
        // const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        // const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;

        return (
            <div>
                <div>
                    <div class="card-header">
                    </div>
                    <div>
                        {/* <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}> */}
                        <div class="card-body m0">
                            <ul class="n-list">
                                {_.orderBy(notification.List, ['dateAdded'], ['desc']).map((e, i) => {
                                    switch (e.type) {
                                        case 'fileNewUpload': {
                                            return <div key={i}><DocumentTemplate data={e} index={i} /></div>
                                        }
                                    }
                                })}
                                {/* <li class="pd0">
                                    <div class="d-flex-sb">
                                        <div class="n">
                                            <div class="n-header"><i class="fa fa-check-circle mr5 n-unread"></i>Task in Accounting</div>
                                            <div class="n-content">
                                                <div class="n-title">Accounting Reports for February 2019</div>
                                                <div className="d-flex">
                                                    <img src="/images/user.png"></img>
                                                    <div class="n-from mr5">Karen King<span></span></div>
                                                    <div class="n-action">Uploaded a new file</div>
                                                </div>
                                                <div class="n-time ml40">2 minutes ago</div>
                                                <div class="n-b-content text-cyan"><i class="fa fa-circle mr20"></i>User Matrix.xlsx</div>
                                            </div>
                                        </div>
                                        <div class="p-2">Flex item</div>
                                    </div>
                                </li> */}
                            </ul>
                            {/* <div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope="col" class="td-left" >Notification</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                    </tbody>
                                </table>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentList);