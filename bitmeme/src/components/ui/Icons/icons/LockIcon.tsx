import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function LockIcon({ props, size = 18, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      {...props}
    >
      <Path
        d="M6.11133 8.33344V5.44455C6.11133 3.849 7.40466 2.55566 9.00022 2.55566C10.5958 2.55566 11.8891 3.849 11.8891 5.44455V8.33344"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11.4443V12.3332"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.3331 8.33301H5.66645C4.68461 8.33301 3.88867 9.12895 3.88867 10.1108V13.6663C3.88867 14.6482 4.68461 15.4441 5.66645 15.4441H12.3331C13.315 15.4441 14.1109 14.6482 14.1109 13.6663V10.1108C14.1109 9.12895 13.315 8.33301 12.3331 8.33301Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
