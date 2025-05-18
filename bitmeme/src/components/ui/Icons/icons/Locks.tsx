import Svg, { Path, SvgProps } from 'react-native-svg';

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function LocksIcon({ props, size = 18, color }: IconProps) {
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
        d="M6.111 8.333V5.444a2.889 2.889 0 1 1 5.778 0v2.89M9 11.444v.89"
      />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12.333 8.333H5.666c-.981 0-1.777.796-1.777 1.778v3.556c0 .982.796 1.777 1.777 1.777h6.667c.982 0 1.778-.796 1.778-1.777V10.11c0-.982-.796-1.778-1.778-1.778Z"
      />
    </Svg>
  );
}
