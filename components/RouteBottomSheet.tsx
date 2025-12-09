import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  TouchableOpacity,
  type PanResponderGestureState,
} from "react-native";

type Props = {
  children: React.ReactNode;
};

const RouteBottomSheet: React.FC<Props> = ({ children }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const SNAP_POINTS = {
    EXPANDED: -180,
    COLLAPSED: 0,
    HIDDEN: 140,
  };

  const lastSnap = useRef(SNAP_POINTS.COLLAPSED);

  const animateTo = (toValue: number) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    }).start();
    lastSnap.current = toValue;
  };

  const decideSnap = (gesture: PanResponderGestureState) => {
    const { dy, vy } = gesture;
    if (dy > 70 || vy > 0.75) {
      return SNAP_POINTS.HIDDEN;
    }
    if (dy < -70 || vy < -0.75) {
      return SNAP_POINTS.EXPANDED;
    }
    return SNAP_POINTS.COLLAPSED;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6,

      onPanResponderMove: (_, gesture) => {
        const base = lastSnap.current;
        let next = base + gesture.dy;
        if (next < SNAP_POINTS.EXPANDED) next = SNAP_POINTS.EXPANDED;
        if (next > SNAP_POINTS.HIDDEN) next = SNAP_POINTS.HIDDEN;
        translateY.setValue(next);
      },

      onPanResponderRelease: (_, gesture) => {
        const toValue = decideSnap(gesture);
        animateTo(toValue);
      },
    })
  ).current;

  const handleToggle = () => {
    if (lastSnap.current === SNAP_POINTS.EXPANDED) {
      animateTo(SNAP_POINTS.COLLAPSED);
    } else {
      animateTo(SNAP_POINTS.EXPANDED);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handleToggle}>
        <View style={styles.handleWrapper}>
          <View style={styles.handle} />
        </View>
      </TouchableOpacity>

      <View style={styles.innerCard}>{children}</View>
    </Animated.View>
  );
};

export default RouteBottomSheet;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  handleWrapper: {
    alignItems: "center",
    marginBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#d1d5db",
  },
  innerCard: {
  },
});
