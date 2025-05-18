import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function RightIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      {...props}
      fill="none"
    >
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="m6.5 3.5 5.92 5.426a.1.1 0 0 1 0 .148L6.5 14.5"
      />
    </Svg>
  );
}
