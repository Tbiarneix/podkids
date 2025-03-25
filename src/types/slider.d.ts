declare module '@react-native-community/slider' {
  import { ComponentClass } from 'react';
  import { ViewProps } from 'react-native';

  export interface SliderProps extends ViewProps {
    /**
     * Initial value of the slider
     */
    value?: number;

    /**
     * Step value of the slider. The value should be between 0 and maximumValue - minimumValue)
     */
    step?: number;

    /**
     * The minimum value for the slider
     */
    minimumValue?: number;

    /**
     * The maximum value for the slider
     */
    maximumValue?: number;

    /**
     * The color used for the track to the left of the button
     */
    minimumTrackTintColor?: string;

    /**
     * The color used for the track to the right of the button
     */
    maximumTrackTintColor?: string;

    /**
     * The color used for the thumb
     */
    thumbTintColor?: string;

    /**
     * If true the user won't be able to move the slider
     */
    disabled?: boolean;

    /**
     * Callback continuously called while the user is dragging the slider
     */
    onValueChange?: (value: number) => void;

    /**
     * Callback called when the user starts changing the value (e.g. when the slider is pressed)
     */
    onSlidingStart?: (value: number) => void;

    /**
     * Callback called when the user finishes changing the value (e.g. when the slider is released)
     */
    onSlidingComplete?: (value: number) => void;
  }

  const Slider: ComponentClass<SliderProps>;
  export default Slider;
}
