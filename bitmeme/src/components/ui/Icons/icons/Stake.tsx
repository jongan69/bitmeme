import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function StakeIcon({ props, size = 18, color }: IconProps) {
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
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="M3.75 2.75h9.5a2 2 0 0 1 2 2v9.5"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="M4.74 7.75h5.51v5.51M10.25 7.75l-7.5 7.5"
      />
    </Svg>
  );
}
