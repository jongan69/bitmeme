import Svg, { Circle, Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function FilterIcon({ props, size = 18, color }: IconProps) {
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
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="M3.25 3v7.5m0 4.5v-.5M8.75 3v3.5m0 8.5v-4.5M14.75 3v1.5m0 10.5V8.5"
      />
      <Circle
        cx={3.25}
        cy={12.5}
        r={1.75}
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <Circle
        cx={8.75}
        cy={8.5}
        r={1.75}
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <Circle
        cx={14.75}
        cy={6.5}
        r={1.75}
        stroke="currentColor"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </Svg>
  );
}
