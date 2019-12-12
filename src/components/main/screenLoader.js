import React, { Component } from "react";
import { connect } from "react-redux";

@connect(store => {
    return {
        loader: store.screenLoader
    };
})

export default function (ComposedComponent) {
    class ScreenLoading extends Component {
        render() {
            const { loader } = { ...this.props }
            return (
                <div>
                    {loader.Loading &&
                        <div className="screen-loading">
                            <div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                        </div>
                    }
                    <ComposedComponent {...this.props} />
                </div>
            );
        }
    }

    return ScreenLoading;
}
