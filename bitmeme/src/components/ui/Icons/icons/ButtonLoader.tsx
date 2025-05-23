import React, { useEffect } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Path, SvgProps } from "react-native-svg";

interface IconProps {
  props?: SvgProps;
  size?: number;
  color?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ButtonLoader({ props, size = 24, color = "#000" }: IconProps) {
  // Create animated values for each segment
  const opacities = React.useMemo(
    () => [
      new Animated.Value(0.3),
      new Animated.Value(0.3),
      new Animated.Value(0.3),
      new Animated.Value(0.3),
    ],
    []
  );

  useEffect(() => {
    opacities.forEach((opacity, i) => {
      const animate = () => {
        Animated.sequence([
          Animated.delay(i * 187.5), // staggered delay
          Animated.timing(opacity, {
            toValue: 1,
            duration: 150,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 450,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      animate();
    });
  }, [opacities]);

  return (
    <Svg
      {...props}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <AnimatedPath
        d="M21.5119 11.3333C21.0346 11.3333 20.6132 10.9907 20.5279 10.5053C19.9039 6.92266 17.0772 4.09599 13.4959 3.47199C12.9519 3.37733 12.5866 2.85999 12.6826 2.31599C12.7772 1.77199 13.2946 1.40533 13.8399 1.50266C18.2519 2.27066 21.7306 5.75066 22.4999 10.1627C22.5946 10.7067 22.2306 11.2253 21.6866 11.32C21.6279 11.3307 21.5706 11.3347 21.5132 11.3347L21.5119 11.3333Z"
        fill={color}
        opacity={opacities[0]}
      />
      <AnimatedPath
        d="M13.6652 22.5133C13.1879 22.5133 12.7666 22.1707 12.6812 21.6853C12.5866 21.1413 12.9506 20.6227 13.4946 20.528C17.0772 19.904 19.9039 17.0773 20.5279 13.496C20.6226 12.9507 21.1439 12.5867 21.6839 12.6827C22.2279 12.7773 22.5932 13.2947 22.4972 13.84C21.7292 18.252 18.2492 21.7307 13.8372 22.5C13.7786 22.5107 13.7212 22.5147 13.6639 22.5147L13.6652 22.5133Z"
        fill={color}
        opacity={opacities[1]}
      />
      <AnimatedPath
        d="M10.3346 22.5133C10.2773 22.5133 10.22 22.5093 10.1613 22.4987C5.7493 21.7307 2.27064 18.2493 1.5013 13.8387C1.40664 13.2947 1.77064 12.776 2.31464 12.6813C2.85597 12.5853 3.37597 12.9507 3.47064 13.4947C4.09464 17.0773 6.9213 19.904 10.5026 20.528C11.0466 20.6227 11.412 21.14 11.316 21.684C11.232 22.1707 10.8093 22.5133 10.332 22.5133H10.3346Z"
        fill={color}
        opacity={opacities[2]}
      />
      <AnimatedPath
        d="M2.48796 11.3333C2.43062 11.3333 2.37329 11.3293 2.31596 11.3186C1.77196 11.224 1.40662 10.7066 1.50262 10.1613C2.27062 5.7493 5.74929 2.27063 10.1613 1.5013C10.7106 1.4093 11.224 1.77063 11.3186 2.31463C11.4133 2.85863 11.0493 3.3773 10.5053 3.47197C6.92262 4.09597 4.09596 6.92263 3.47196 10.504C3.38796 10.9906 2.96529 11.3333 2.48796 11.3333Z"
        fill={color}
        opacity={opacities[3]}
      />
      <Path
        d="M12.0001 8.66669C10.1614 8.66669 8.66675 10.1614 8.66675 12C8.66675 13.8387 10.1614 15.3334 12.0001 15.3334C13.8387 15.3334 15.3334 13.8387 15.3334 12C15.3334 10.1614 13.8387 8.66669 12.0001 8.66669Z"
        fill={color}
      />
    </Svg>
  );
}
