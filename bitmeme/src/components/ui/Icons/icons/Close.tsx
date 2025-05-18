import Svg, { G, Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function CloseIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
    >
      <G fill={color}>
        <Path
          d="M4,14.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L13.47,3.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L4.53,14.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        ></Path>
        <Path
          d="M14,14.75c-.192,0-.384-.073-.53-.22L3.47,4.53c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0L14.53,13.47c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        ></Path>
      </G>
    </Svg>
  );
}
