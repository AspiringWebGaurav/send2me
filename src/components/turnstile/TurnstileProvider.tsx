"use client";

import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { TurnstileStatus } from "@/types/turnstile";

interface TurnstileState {
  status: TurnstileStatus;
  token: string | null;
  error: string | null;
  isWidgetReady: boolean;
}

type TurnstileAction =
  | { type: "RESET" }
  | { type: "WIDGET_LOADING" }
  | { type: "WIDGET_READY" }
  | { type: "VERIFY_SUCCESS"; token: string }
  | { type: "VERIFY_FAILURE"; error: string }
  | { type: "EXPIRED" };

const initialState: TurnstileState = {
  status: "idle",
  token: null,
  error: null,
  isWidgetReady: false,
};

const TurnstileVerificationContext = createContext<{
  state: TurnstileState;
  dispatch: Dispatch<TurnstileAction>;
} | null>(null);

const reducer = (state: TurnstileState, action: TurnstileAction): TurnstileState => {
  switch (action.type) {
    case "RESET":
      return { ...initialState };
    case "WIDGET_LOADING":
      return {
        status: "idle",
        token: null,
        error: null,
        isWidgetReady: false,
      };
    case "WIDGET_READY":
      return {
        ...state,
        status: state.status === "success" ? state.status : "ready",
        isWidgetReady: true,
        error: null,
      };
    case "VERIFY_SUCCESS":
      return {
        status: "success",
        token: action.token,
        error: null,
        isWidgetReady: true,
      };
    case "VERIFY_FAILURE":
      return {
        status: "failed",
        token: null,
        error: action.error,
        isWidgetReady: state.isWidgetReady,
      };
    case "EXPIRED":
      return {
        status: "expired",
        token: null,
        error: "Verification expired. Please try again.",
        isWidgetReady: state.isWidgetReady,
      };
    default:
      return state;
  }
};

/**
 * Shares the latest Turnstile verification state and reducer controls with the
 * component tree.
 */
export function TurnstileVerificationProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state, dispatch],
  );

  return (
    <TurnstileVerificationContext.Provider value={contextValue}>
      {children}
    </TurnstileVerificationContext.Provider>
  );
}

/**
 * Accessor for the raw Turnstile verification context. Prefer using
 * `useTurnstileVerification` for higher-level helpers.
 */
export function useTurnstileVerificationContext() {
  const context = useContext(TurnstileVerificationContext);
  if (!context) {
    throw new Error("useTurnstileVerificationContext must be used within TurnstileVerificationProvider");
  }
  return context;
}
