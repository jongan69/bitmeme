import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}   

export default function TransactionIcon({ props, size = 18, color }: IconProps) {
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
        d="M4.2 1.7 1.7 4.2l2.5 2.5M1.7 4.2h5.5M13.7 11.2l2.5 2.5-2.5 2.5M16.2 13.7h-5.5"
      />
      <Path
        fill="currentColor"
        d="M9 12.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5"
      />
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        d="M4.2 1.7 1.7 4.2l2.5 2.5M1.7 4.2h5.5"
      />
    </Svg>
  );
}
