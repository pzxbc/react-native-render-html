import React, { PureComponent } from 'react';
import { Image, View, Text, PixelRatio, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';

export default class HTMLImage extends PureComponent {
    constructor (props) {
        super(props);
        this.state = {
            width: props.imagesInitialDimensions.width,
            height: props.imagesInitialDimensions.height
        };
    }

    static propTypes = {
        source: PropTypes.object.isRequired,
        alt: PropTypes.string,
        height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        style: Image.propTypes.style,
        imagesMaxWidth: PropTypes.number,
        imagesInitialDimensions: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number
        })
    }

    static defaultProps = {
        imagesInitialDimensions: {
            width: 0,
            height: 0
        }
    }

    componentDidMount () {
        this.getImageSize();
        this.mounted = true;
    }

    componentWillUnmount () {
        this.mounted = false;
    }

    componentWillReceiveProps (nextProps) {
        this.getImageSize(nextProps);
    }

    getDimensionsFromStyle (style, height, width) {
        let styleWidth;
        let styleHeight;

        if (height) {
            styleHeight = height;
        }
        if (width) {
            styleWidth = width;
        }
        if (Array.isArray(style)) {
            style.forEach((styles) => {
                if (!width && styles['width']) {
                    styleWidth = styles['width'];
                }
                if (!height && styles['height']) {
                    styleHeight = styles['height'];
                }
            });
        } else {
            if (!width && style['width']) {
                styleWidth = style['width'];
            }
            if (!height && style['height']) {
                styleHeight = style['height'];
            }
        }

        return { styleWidth, styleHeight };
    }

    getImageSize (props = this.props) {
        const { source, imagesMaxWidth, style, height, width } = props;
        const { styleWidth, styleHeight } = this.getDimensionsFromStyle(style, height, width);

        if (styleWidth && styleHeight) {
            return this.mounted && this.setState({
                width: typeof styleWidth === 'string' && styleWidth.search('%') !== -1 ? styleWidth : parseInt(styleWidth, 10),
                height: typeof styleHeight === 'string' && styleHeight.search('%') !== -1 ? styleHeight : parseInt(styleHeight, 10)
            });
        }
        // Fetch image dimensions only if they aren't supplied or if with or height is missing
        Image.getSize(
            source.uri,
            (originalWidth, originalHeight) => {
                // divide pixelratio
                let ratio = PixelRatio.get()
                originalWidth = originalWidth / ratio
                originalHeight = originalHeight /ratio
                if (!imagesMaxWidth) {
                    return this.mounted && this.setState({ width: originalWidth, height: originalHeight });
                }
                const optimalWidth = imagesMaxWidth <= originalWidth ? imagesMaxWidth : originalWidth;
                const optimalHeight = (optimalWidth * originalHeight) / originalWidth;
                this.mounted && this.setState({ width: optimalWidth, height: optimalHeight, error: false });
            },
            () => {
                this.mounted && this.setState({ error: true });
            }
        );
    }

    validImage (source, style, props = {}) {
        return (
            <TouchableWithoutFeedback onPress={() => this.props.onImagePress && this.props.onImagePress(source.uri)}>
                <Image
                source={source}
                resizeMode={'contain'}
                style={[style, { width: this.state.width, height: this.state.height}]}
                {...props}
                />
            </TouchableWithoutFeedback>
        );
    }

    get errorImage () {
        return (
            <View style={{ width: 50, height: 50, borderWidth: 1, borderColor: 'lightgray', overflow: 'hidden', justifyContent: 'center' }}>
                { this.props.alt ? <Text style={{ textAlign: 'center', fontStyle: 'italic' }}>{ this.props.alt }</Text> : false }
            </View>
        );
    }

    render () {
        // 这里passProps应该为空，render传进来之前已经解构了
        const { source, style, passProps } = this.props;

        if (this.state.width === 0 || this.state.height === 0) {
          return (
            <View style={{width: 32, height: 32, justifyContent: "center", alignItems: "center"}}>
              <ActivityIndicator size="small" />
            </View>
          )
        }

        return !this.state.error ? this.validImage(source, style, passProps) : this.errorImage;
    }
}
