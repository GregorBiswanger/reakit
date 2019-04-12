import * as React from "react";
import {
  TabbableOptions,
  TabbableProps,
  useTabbable
} from "../Tabbable/Tabbable";
import { unstable_useOptions } from "../system/useOptions";
import { unstable_useProps } from "../system/useProps";
import { unstable_createComponent } from "../utils/createComponent";
import { mergeProps } from "../utils/mergeProps";
import { unstable_useId } from "../utils/useId";
import { useUpdateEffect } from "../__utils/useUpdateEffect";
import { Keys } from "../__utils/types";
import { RoverStateReturn, useRoverState } from "./RoverState";

export type RoverOptions = TabbableOptions &
  Pick<Partial<RoverStateReturn>, "orientation"> &
  Pick<
    RoverStateReturn,
    | "unstable_stops"
    | "currentId"
    | "unstable_register"
    | "unstable_unregister"
    | "move"
    | "next"
    | "previous"
    | "first"
    | "last"
  > & {
    /**
     * Element ID.
     */
    stopId?: string;
  };

export type RoverProps = TabbableProps;

export function useRover(
  options: RoverOptions,
  { tabIndex, onKeyDown, ...htmlProps }: RoverProps = {}
) {
  options = unstable_useOptions("useRover", options, htmlProps);

  const ref = React.useRef<HTMLElement>(null);
  const id = unstable_useId("rover-");
  const stopId = options.stopId || htmlProps.id || id;

  const reallyDisabled = options.disabled && !options.focusable;
  const noFocused = options.currentId == null;
  const focused = options.currentId === stopId;
  const isFirst =
    options.unstable_stops[0] && options.unstable_stops[0].id === stopId;
  const shouldTabIndex = focused || (isFirst && noFocused);

  React.useEffect(() => {
    if (reallyDisabled) return undefined;
    options.unstable_register(stopId, ref);
    return () => options.unstable_unregister(stopId);
  }, [
    stopId,
    reallyDisabled,
    options.unstable_register,
    options.unstable_unregister
  ]);

  useUpdateEffect(() => {
    if (ref.current && focused) {
      ref.current.focus();
    }
  }, [focused]);

  htmlProps = mergeProps(
    {
      ref,
      id: stopId,
      tabIndex: shouldTabIndex ? tabIndex : -1,
      onFocus: () => options.move(stopId),
      onKeyDown: event => {
        const { orientation } = options;
        const keyMap = {
          ArrowUp: orientation !== "horizontal" && options.previous,
          ArrowRight: orientation !== "vertical" && options.next,
          ArrowDown: orientation !== "horizontal" && options.next,
          ArrowLeft: orientation !== "vertical" && options.previous,
          Home: options.first,
          End: options.last,
          PageUp: options.first,
          PageDown: options.last
        };
        if (event.key in keyMap) {
          const key = event.key as keyof typeof keyMap;
          const action = keyMap[key];
          if (action) {
            event.preventDefault();
            action();
            // Prevent onKeyDown from being called twice for the same keys.
            return;
          }
        }
        if (onKeyDown) {
          onKeyDown(event);
        }
      }
    } as RoverProps,
    htmlProps
  );

  htmlProps = useTabbable(options, htmlProps);
  htmlProps = unstable_useProps("useRover", options, htmlProps);
  return htmlProps;
}

const keys: Keys<RoverStateReturn & RoverOptions> = [
  ...useTabbable.__keys,
  ...useRoverState.__keys,
  "stopId"
];

useRover.__keys = keys;

export const Rover = unstable_createComponent({
  as: "button",
  useHook: useRover
});