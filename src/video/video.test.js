import React from 'react';
import { mount, shallow } from 'enzyme';
import video from './video';
import { EVENTS } from './constants';

const mediaId = 'test-media';

const TestControl = ({ duration }) => {
    return (
        <div>
            { duration }
        </div>
    );
};

const TestVideo = ({ video, ...restProps }) => {
    // Remove `mediaEl` so we do not spread an unsupported
    // prop onto a DOM element.
    delete restProps.mediaEl;
    delete restProps.mediaId;
    return (
        <div>
            <video id={mediaId} {...restProps}>
                <source src="1" />
            </video>
            <TestControl {...video} />
        </div>
    );
};

describe('video', () => {
    let Component;
    let component;

    beforeAll(() => {
        Component = video(TestVideo);
    });

    describe('the wrapped component', () => {
        beforeEach(() => {
            component = mount(
                <Component mediaId={mediaId} autoPlay />,
            );
        });

        describe('HTMLMediaElement API as props', () => {
            let testControl;
            beforeEach(() => {
                component = mount(
                    <Component mediaId={mediaId} autoPlay />,
                    { attachTo: document.body },
                );
                testControl = component.find(TestControl);
                expect(testControl.props()).toEqual({});
            });

            it('should be provided when a video event is triggered', () => {
                component.find('video').node.dispatchEvent(new Event('play'));
            });

            it('should be provided when an error occurs on last source element', () => {
                component.find('source').node.dispatchEvent(new Event('error'));
            });

            afterEach(() => {
                // Only matching a subset is sufficient.
                expect(testControl.props()).toMatchObject({
                    controller: undefined,
                    autoPlay: undefined,
                    controls: false,
                    currentSrc: '',
                    currentTime: 0,
                    defaultMuted: false,
                    defaultPlaybackRate: 1,
                    duration: 0,
                    ended: false,
                    error: undefined,
                    loop: false,
                    mediaGroup: undefined,
                    muted: false,
                    networkState: 0,
                    paused: true,
                    playbackRate: 1,
                    preload: '',
                    readyState: 0,
                    seeking: false,
                    src: '',
                    startDate: undefined,
                    volume: 1
                });
            });
        });

        it('should remove all event listeners from the video element when unmounted', () => {
            const removeEventListenerSpy = jest.fn();
            component = mount(
                <Component mediaId={mediaId} autoPlay />,
                { attachTo: document.body }
            );
            const updateState = component.instance().updateState;
            component.find('video').node.removeEventListener = removeEventListenerSpy;
            expect(removeEventListenerSpy).not.toHaveBeenCalled();
            component.unmount();
            EVENTS.forEach((event) => {
                expect(removeEventListenerSpy).toHaveBeenCalledWith(event.toLowerCase(), updateState);
            });
        });

        it('should remove "error" event listener from the source element when unmounted', () => {
            const removeEventListenerSpy = jest.fn();
            component = mount(
                <Component mediaId={mediaId} autoPlay />,
                { attachTo: document.body }
            );
            const updateState = component.instance().updateState;
            component.find('source').node.removeEventListener = removeEventListenerSpy;
            expect(removeEventListenerSpy).not.toHaveBeenCalled();
            component.unmount();
            expect(removeEventListenerSpy).toHaveBeenCalledWith('error', updateState);
        });
    });

    describe('mapping to props', () => {
        let mediaEl = {};

        beforeAll(() => {
            component = shallow(
                <Component mediaId={mediaId} autoPlay />
            );
            // Emulate mediaEl being present
            // e.g. componentDidMount fired.
            component.instance().mediaEl = mediaEl;
            component.instance().forceUpdate();
        });

        beforeEach(() => {
            // Reset spy
            mediaEl.play = jest.fn();
        });

        it('returns a component with it\'s ownProps', () => {
            expect(component.find(TestVideo).prop('autoPlay'))
                .toBe(true);
        });

        it('returns a component with a mediaEl prop', () => {
            expect(component.find(TestVideo).prop('mediaEl'))
                .toBe(mediaEl);
        });

        it('returns a component with all of its state on the `video` prop', () => {
            const state = {
                html5: '1',
                dom: 2,
                properties: function() {
                    return 3;
                }
            };
            component.setState(state);
            expect(component.find(TestVideo).prop('video'))
                .toEqual(state);
        });

        it('can customise the mapping of props using mapToProps', () => {
            const Component = video(TestVideo, (state, ownProps) => {
                return {
                    state,
                    ownProps
                };
            });
            const component = shallow(
                <Component mediaId={mediaId} autoPlay />
            );
            component.setState({
                paused: true
            });
            expect(component.find(TestVideo).prop('state').paused)
                .toBe(true);
            expect(component.find(TestVideo).prop('ownProps').autoPlay)
                .toBe(true);
        });

        it('can map mediaEl to props for creating custom API methods', () => {
            const Component = video(TestVideo, undefined, (el, state, ownProps) => {
                return {
                    togglePlay: () => {
                        el.play(ownProps.testProp);
                    }
                }
            });
            const component = shallow(
                <Component autoPlay mediaId={mediaId} testProp="testValue" />
            );
            component.instance().mediaEl = mediaEl;
            component.instance().forceUpdate();
            component.find(TestVideo).prop('togglePlay')();
            expect(mediaEl.play).toHaveBeenCalledWith('testValue');
        });

        it('allows mapMediaElToProps to take precedence over mapStateToProps', () => {
            const Component = video(TestVideo, () => ({
                duplicateKey: 'mapStateToProps'
            }), () => ({
                duplicateKey: 'mapMediaElToProps'
            }));
            const component = shallow(
                <Component mediaId={mediaId} />
            );
            expect(component.find(TestVideo).prop('duplicateKey')).toBe('mapMediaElToProps');
        });

        it('allows ownProps to take precedence over mapMediaElToProps and mapStateToProps', () => {
            const Component = video(TestVideo, () => ({
                duplicateKey: 'mapStateToProps'
            }), () => ({
                duplicateKey: 'mapMediaElToProps'
            }));
            const component = shallow(
                <Component mediaId={mediaId} duplicateKey="ownProps" />
            );
            expect(component.find(TestVideo).prop('duplicateKey')).toBe('ownProps');
        });

        it('allows cusomtisation of merging ownProps, mapMediaElToProps and mapStateToProps to change the merging precedence', () => {
            const Component = video(TestVideo, () => ({
                duplicateKey: 'mapStateToProps'
            }), () => ({
                duplicateKey: 'mapMediaElToProps'
            }), (stateProps, mediaElProps, ownProps) =>
                Object.assign({}, ownProps, stateProps, mediaElProps));
            const component = shallow(
                <Component mediaId={mediaId} duplicateKey="ownProps" />
            );
            expect(component.find(TestVideo).prop('duplicateKey')).toBe('mapMediaElToProps');
        });
    });
});



