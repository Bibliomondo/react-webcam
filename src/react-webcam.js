import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';

require('webrtc-adapter/out/adapter.js');

export function hasGetUserMedia() {
  return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

export class Webcam extends Component {
  static defaultProps = {
    audio: true,
    height: 480,
    width: 640,
	requireRearCamera: true,
    screenshotFormat: 'image/webp',
    onUserMedia: () => {}
  };

  static propTypes = {
	videoIdTag: PropTypes.string.isRequired,
    audio: PropTypes.bool,
    muted: PropTypes.bool,
    onUserMedia: PropTypes.func,
    height: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    width: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    screenshotFormat: PropTypes.oneOf([
      'image/webp',
      'image/png',
      'image/jpeg'
    ]),
	requireRearCamera: PropTypes.bool,
    className: PropTypes.string,
	handleOnClick: PropTypes.func,
  };

  static mountedInstances = [];

  static userMediaRequested = false;

  constructor() {
    super();
    this.state = {
      hasUserMedia: false
    };
  }

  componentDidMount() {
    if (!hasGetUserMedia()) return;

    Webcam.mountedInstances.push(this);

    if (!this.state.hasUserMedia && !Webcam.userMediaRequested) {
      this.requestUserMedia();
    }
  }

  requestUserMedia() {
    
    const facingMode = this.props.requireRearCamera ? "environment" : "user";
	navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: facingMode } } }).then(function (stream) {	
		Webcam.mountedInstances.forEach((instance) => instance.handleUserMedia(stream));
	}).catch(function (error) {
		Webcam.mountedInstances.forEach((instance) => instance.handleUserMediaError(error));
	});
    Webcam.userMediaRequested = true;
  }

  handleUserMediaError(error) {
		this.setState({
			hasUserMedia: false,
		});
		return;
    }

    handleUserMedia(stream) {
        // createObjectURL is deprecated
        document.getElementById(this.props.videoIdTag).srcObject = stream;

        this.stream = stream;
        this.setState({
            hasUserMedia: true,
        });

        this.props.onUserMedia();
    }

  componentWillUnmount() {
    let index = Webcam.mountedInstances.indexOf(this);
    Webcam.mountedInstances.splice(index, 1);

	this.setState({
            hasUserMedia: false,
	});
    if (Webcam.mountedInstances.length === 0 && this.state.hasUserMedia) {
      if (this.stream.stop) {
        this.stream.stop();
      } else {
        if (this.stream.getVideoTracks) {
          for (let track of this.stream.getVideoTracks()) {
            track.stop();
          }
        }
        if (this.stream.getAudioTracks) {
          for (let track of this.stream.getAudioTracks()) {
            track.stop();
          }
        }
      }
      Webcam.userMediaRequested = false;
      window.URL.revokeObjectURL(this.state.src);
    }
  }

  getScreenshot() {
    if (!this.state.hasUserMedia) return null;

    let canvas = this.getCanvas();
    return canvas.toDataURL(this.props.screenshotFormat);
  }

  getCanvas() {
    if (!this.state.hasUserMedia) return null;

    const video = findDOMNode(this);
    if (!this.ctx) {
      let canvas = document.createElement('canvas');
      const aspectRatio = video.videoWidth / video.videoHeight;

      canvas.width = video.clientWidth;
      canvas.height = video.clientWidth / aspectRatio;

      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
    }

    const {ctx, canvas} = this;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas;
  }

  render() {
    return (
      <video
		id={this.props.videoIdTag}
        autoPlay
        width={this.props.width}
        height={this.props.height}
        muted={this.props.muted}
        className={this.props.className}
		onClick={this.props.handleOnClick}
      />
    );
  }
}
