/* eslint-disable */

 /**
 * This is a HoC that finds a single
* <video> in a component and makes
* all its PROPERTIES available as props.
*/
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import {
    EVENTS,
    PROPERTIES,
    TRACKEVENTS
} from './constants';

const defaultMapStateToProps = (state = {}) => Object.assign({
    video: {
        ...state
    }
});

const defaultMapMediaElToProps = (mediaEl) => ({
    mediaEl
});

const defaultMergeProps = (
    stateProps = {},
    mediaElProps = {},
    ownProps = {}
) => Object.assign({}, stateProps, mediaElProps, ownProps);

export default (
    BaseComponent,
    mapStateToProps = defaultMapStateToProps,
    mapMediaElToProps = defaultMapMediaElToProps,
    mergeProps = defaultMergeProps,
    videoId
) => class Video extends Component {
    constructor(props) {
        super(props);
        this.updateState = this.updateState.bind(this);
        this.state = {};
    }

    updateState() {
        this.setState(
            PROPERTIES.reduce((p, c) => {
                p[c] = this.mediaEl && this.mediaEl[c];
                return p;
            }, {})
        );
    }

    bindEventsToUpdateState() {
        EVENTS.forEach(event => {
          this.mediaEl && this.mediaEl.addEventListener(event.toLowerCase(), this.updateState);
        });

        TRACKEVENTS.forEach(event => {
            // TODO: JSDom does not have this method on
            // `textTracks`. Investigate so we can test this without this check.
            this.mediaEl && this.mediaEl.textTracks.addEventListener
            && this.mediaEl.textTracks.addEventListener(event.toLowerCase(), this.updateState);
        });

        // If <source> elements are used instead of a src attribute then
        // errors for unsupported format do not bubble up to the <video>.
        // Do this manually by listening to the last <source> error event
        // to force an update.
        // https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_HTML5_audio_and_video
        const sources = this.mediaEl && this.mediaEl.getElementsByTagName('source');
        if (sources && sources.length) {
            const lastSource = sources[sources.length - 1];
            lastSource.addEventListener('error', this.updateState);
        }
    }

    unbindEvents() {
        EVENTS.forEach(event => {
          this.mediaEl && this.mediaEl.removeEventListener(event.toLowerCase(), this.updateState);
        });
        TRACKEVENTS.forEach(event => {
            // TODO: JSDom does not have this method on
            // `textTracks`. Investigate so we can test this without this check.
            this.mediaEl && this.mediaEl.textTracks.removeEventListener
            && this.mediaEl.textTracks.removeEventListener(event.toLowerCase(), this.updateState);
        });

        const sources = this.mediaEl && this.mediaEl.getElementsByTagName('source');
        if (sources && sources.length) {
            const lastSource = sources[sources.length - 1];
            lastSource.removeEventListener('error', this.updateState);
        }
    }

    componentWillUnmount() {
        this.unbindEvents();
    }

    // Stop `this.el` from being null briefly on every rendxwxer,
    // see: https://github.com/mderrick/react-html5video/pull/65
    setRef(el) {
        this.el = findDOMNode(el);
    }

    componentDidMount() {
      if (!this.props.mediaId) return;
      this.mediaEl = document.getElementById(this.props.mediaId);
      if (this.mediaEl) {
        this.bindEventsToUpdateState();
      }
    }

    componentDidUpdate(lastProps) {
      if (!this.props.mediaId) return;
      if (lastProps.mediaId !== this.props.mediaId) {
        this.unbindEvents();
        this.mediaEl = document.getElementById(this.props.mediaId);
        if (this.mediaEl) {
          this.bindEventsToUpdateState();
        }
      }
    }

    render() {
        const stateProps = mapStateToProps(
            this.state,
            this.props
        );
        const mediaElProps = mapMediaElToProps(
            this.mediaEl,
            this.state,
            this.props
        );
        return (
            <div ref={this.setRef.bind(this)}>
                <BaseComponent
                    {...mergeProps(
                        stateProps,
                        mediaElProps,
                        this.props)} />
            </div>
        );
    }
}
