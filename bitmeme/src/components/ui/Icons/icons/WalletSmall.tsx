import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

export default function WalletSmallIcon({ props, size = 12, color }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      {...props}
    >
      <Path
        d="M0.75 3C0.336 3 0 2.664 0 2.25C0 1.009 1.01 0 2.25 0H7.25C7.664 0 8 0.336 8 0.75C8 1.164 7.664 1.5 7.25 1.5H2.25C1.837 1.5 1.5 1.836 1.5 2.25C1.5 2.664 1.164 3 0.75 3Z"
        fill={color}
      />
      <Path
        d="M10.25 3H2.25C1.837 3 1.5 2.664 1.5 2.25C1.5 1.836 1.164 1.5 0.75 1.5C0.336 1.5 0 1.836 0 2.25V8.25C0 9.767 1.233 11 2.75 11H10.25C11.215 11 12 10.215 12 9.25V4.75C12 3.785 11.215 3 10.25 3ZM8 8C7.448 8 7 7.552 7 7C7 6.448 7.448 6 8 6C8.552 6 9 6.448 9 7C9 7.552 8.552 8 8 8Z"
        fill={color}
      />
    </Svg>
  );
}
