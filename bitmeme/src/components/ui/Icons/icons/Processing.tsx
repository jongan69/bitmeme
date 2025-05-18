import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function ProcessingIcon({ props, size = 18, color }: IconProps) {
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
        d="M4.208 7.567a5 5 0 0 0 8.838 4.37m-8.838-4.37-2 2m2-2 2 2m-1.11-3.695a5 5 0 0 1 8.734 4.416m0 0-2-2m2 2 2-2"
      />
    </Svg>
  );
}
