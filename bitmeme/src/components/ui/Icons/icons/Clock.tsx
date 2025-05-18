import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function ClockIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      {...props}
    >
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="m10.885 10.786-2.696-.899V6.13m7.189 2.859a7.189 7.189 0 1 0-.962 3.594M13.406 8.2l1.797 1.797L17 8.2"
      />
    </Svg>
  );
}
